import db, { initDatabase, seedDemoData } from './db';
import {
  Product,
  Location,
  InventoryItem,
  Supplier,
  Customer,
  InboundOrder,
  InboundOrderItem,
  OutboundOrder,
  OutboundOrderItem,
  StockMovement,
  DashboardStats,
  ProductStatus
} from './types';

// Ensure DB schema exists
initDatabase();

export function getDashboardStats(): DashboardStats {
  const skusCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  
  const stockAgg = db.prepare(`
    SELECT 
      COALESCE(SUM(quantity), 0) as totalUnits,
      COALESCE(SUM(i.quantity * p.cost_price), 0) as totalValuation
    FROM inventory i
    JOIN products p ON i.product_id = p.id
  `).get() as { totalUnits: number; totalValuation: number };

  const productsList = getProducts();
  const lowStockCount = productsList.filter(p => p.status === 'LOW_STOCK').length;
  const outOfStockCount = productsList.filter(p => p.status === 'OUT_OF_STOCK').length;

  const pendingInbound = (db.prepare(`
    SELECT COUNT(*) as count FROM inbound_orders WHERE status IN ('EXPECTED', 'RECEIVING')
  `).get() as { count: number }).count;

  const pendingOutbound = (db.prepare(`
    SELECT COUNT(*) as count FROM outbound_orders WHERE status IN ('PENDING', 'PICKING', 'PACKED')
  `).get() as { count: number }).count;

  const locStats = db.prepare(`
    SELECT 
      COUNT(*) as totalLocs,
      SUM(CASE WHEN current_capacity > 0 THEN 1 ELSE 0 END) as occupiedLocs
    FROM locations
    WHERE type = 'STORAGE'
  `).get() as { totalLocs: number; occupiedLocs: number };

  const totalLocationsCount = locStats.totalLocs || 1;
  const occupiedLocationsCount = locStats.occupiedLocs || 0;
  const occupancyRate = Math.round((occupiedLocationsCount / totalLocationsCount) * 100);

  const zones = db.prepare(`
    SELECT 
      zone,
      COUNT(*) as totalBins,
      SUM(CASE WHEN current_capacity > 0 THEN 1 ELSE 0 END) as occupiedBins
    FROM locations
    WHERE type = 'STORAGE'
    GROUP BY zone
  `).all() as { zone: string; totalBins: number; occupiedBins: number }[];

  const zoneOccupancy = zones.map(z => ({
    zone: z.zone,
    totalBins: z.totalBins,
    occupiedBins: z.occupiedBins,
    rate: z.totalBins > 0 ? Math.round((z.occupiedBins / z.totalBins) * 100) : 0
  }));

  const recentMovements = getStockMovements(8);
  const recentInbound = getInboundOrders().slice(0, 4);
  const recentOutbound = getOutboundOrders().slice(0, 4);

  return {
    totalSkus: skusCount,
    totalStockUnits: stockAgg.totalUnits,
    totalValuation: Math.round(stockAgg.totalValuation * 100) / 100,
    lowStockCount,
    outOfStockCount,
    pendingInboundCount: pendingInbound,
    pendingOutboundCount: pendingOutbound,
    totalLocationsCount,
    occupiedLocationsCount,
    occupancyRate,
    zoneOccupancy,
    recentMovements,
    recentInbound,
    recentOutbound
  };
}

export function getProducts(search?: string, category?: string, status?: string): Product[] {
  let query = `
    SELECT 
      p.*,
      COALESCE(SUM(i.quantity), 0) as total_stock,
      COALESCE(SUM(i.reserved_quantity), 0) as reserved_stock,
      COUNT(DISTINCT i.location_id) as locations_count,
      (SELECT l.code FROM inventory inv JOIN locations l ON inv.location_id = l.id WHERE inv.product_id = p.id LIMIT 1) as primary_location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (search) {
    query += ` AND (p.sku LIKE ? OR p.name LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  if (category && category !== 'ALL') {
    query += ` AND p.category = ?`;
    params.push(category);
  }

  query += ` GROUP BY p.id ORDER BY p.name ASC`;

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(r => {
    const total = Number(r.total_stock) || 0;
    const reserved = Number(r.reserved_stock) || 0;
    const available = Math.max(0, total - reserved);

    let productStatus: ProductStatus = 'IN_STOCK';
    if (total === 0) {
      productStatus = 'OUT_OF_STOCK';
    } else if (total <= r.min_stock) {
      productStatus = 'LOW_STOCK';
    } else if (total > r.max_stock) {
      productStatus = 'OVERSTOCKED';
    }

    return {
      ...r,
      total_stock: total,
      reserved_stock: reserved,
      available_stock: available,
      status: productStatus
    };
  }).filter(p => {
    if (!status || status === 'ALL') return true;
    return p.status === status;
  });
}

export function getProductById(id: string): (Product & { inventoryBreakdown: InventoryItem[] }) | null {
  const product = db.prepare(`
    SELECT 
      p.*,
      COALESCE(SUM(i.quantity), 0) as total_stock,
      COALESCE(SUM(i.reserved_quantity), 0) as reserved_stock
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(id) as any;

  if (!product) return null;

  const inventoryBreakdown = db.prepare(`
    SELECT 
      i.*,
      l.code as location_code,
      l.zone,
      l.aisle,
      l.rack,
      l.shelf,
      l.bin
    FROM inventory i
    JOIN locations l ON i.location_id = l.id
    WHERE i.product_id = ?
  `).all(id) as InventoryItem[];

  const total = Number(product.total_stock) || 0;
  const reserved = Number(product.reserved_stock) || 0;

  let productStatus: ProductStatus = 'IN_STOCK';
  if (total === 0) {
    productStatus = 'OUT_OF_STOCK';
  } else if (total <= product.min_stock) {
    productStatus = 'LOW_STOCK';
  } else if (total > product.max_stock) {
    productStatus = 'OVERSTOCKED';
  }

  return {
    ...product,
    total_stock: total,
    reserved_stock: reserved,
    available_stock: Math.max(0, total - reserved),
    status: productStatus,
    inventoryBreakdown
  };
}

export function getProductByBarcodeOrSku(code: string): Product | null {
  const p = db.prepare(`
    SELECT 
      p.*,
      COALESCE(SUM(i.quantity), 0) as total_stock,
      COALESCE(SUM(i.reserved_quantity), 0) as reserved_stock,
      (SELECT l.code FROM inventory inv JOIN locations l ON inv.location_id = l.id WHERE inv.product_id = p.id LIMIT 1) as primary_location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.barcode = ? OR p.sku = ?
    GROUP BY p.id
  `).get(code, code) as any;

  if (!p) return null;
  const total = Number(p.total_stock) || 0;
  const reserved = Number(p.reserved_stock) || 0;

  return {
    ...p,
    total_stock: total,
    reserved_stock: reserved,
    available_stock: Math.max(0, total - reserved),
    status: total === 0 ? 'OUT_OF_STOCK' : (total <= p.min_stock ? 'LOW_STOCK' : 'IN_STOCK')
  };
}

export function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  category: string;
  barcode: string;
  uom: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  initial_location_id?: string;
  initial_quantity?: number;
}): Product {
  const id = `prod-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (id, sku, name, description, category, barcode, uom, cost_price, selling_price, min_stock, max_stock, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.sku.trim().toUpperCase(),
    data.name.trim(),
    data.description || '',
    data.category || 'General',
    data.barcode.trim(),
    data.uom || 'PCS',
    Number(data.cost_price) || 0,
    Number(data.selling_price) || 0,
    Number(data.min_stock) || 10,
    Number(data.max_stock) || 500,
    now,
    now
  );

  if (data.initial_location_id && Number(data.initial_quantity) > 0) {
    const qty = Number(data.initial_quantity);
    const invId = `inv-${Date.now()}`;
    db.prepare(`
      INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, batch_lot, updated_at)
      VALUES (?, ?, ?, ?, 0, 'INITIAL', ?)
    `).run(invId, id, data.initial_location_id, qty, now);

    db.prepare('UPDATE locations SET current_capacity = current_capacity + ? WHERE id = ?').run(qty, data.initial_location_id);

    db.prepare(`
      INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
      VALUES (?, 'INITIAL_SEED', ?, NULL, ?, ?, 'CREATION', 'NEW-SKU', 'Admin', 'Initial SKU inventory registration', ?)
    `).run(`mov-${Date.now()}`, id, data.initial_location_id, qty, now);
  }

  return getProductById(id)!;
}

export function updateProduct(id: string, data: Partial<Product>): boolean {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      barcode = COALESCE(?, barcode),
      uom = COALESCE(?, uom),
      cost_price = COALESCE(?, cost_price),
      selling_price = COALESCE(?, selling_price),
      min_stock = COALESCE(?, min_stock),
      max_stock = COALESCE(?, max_stock),
      updated_at = ?
    WHERE id = ?
  `).run(
    data.name,
    data.description,
    data.category,
    data.barcode,
    data.uom,
    data.cost_price,
    data.selling_price,
    data.min_stock,
    data.max_stock,
    now,
    id
  );
  return true;
}

export function deleteProduct(id: string): boolean {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return true;
}

export function adjustStock(productId: string, locationId: string, adjustmentQty: number, reason: string, userName = 'Warehouse Lead'): boolean {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM inventory WHERE product_id = ? AND location_id = ?').get(productId, locationId) as any;

  const currentQty = existing ? existing.quantity : 0;
  const newQty = Math.max(0, currentQty + adjustmentQty);
  const diff = newQty - currentQty;

  if (diff === 0) return true;

  if (existing) {
    db.prepare('UPDATE inventory SET quantity = ?, updated_at = ? WHERE id = ?').run(newQty, now, existing.id);
  } else {
    const invId = `inv-${Date.now()}`;
    db.prepare('INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, batch_lot, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
      .run(invId, productId, locationId, newQty, 'MANUAL-ADJ', now);
  }

  db.prepare('UPDATE locations SET current_capacity = MAX(0, current_capacity + ?) WHERE id = ?').run(diff, locationId);

  db.prepare(`
    INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
    VALUES (?, 'STOCK_ADJUSTMENT', ?, ?, ?, ?, 'MANUAL_ADJ', 'ADJ-${Date.now()}', ?, ?, ?)
  `).run(`mov-${Date.now()}`, productId, diff < 0 ? locationId : null, diff > 0 ? locationId : null, Math.abs(diff), userName, reason || 'Stock adjustment count', now);

  return true;
}

export function transferStock(productId: string, fromLocationId: string, toLocationId: string, quantity: number, reason = 'Bin Reorganization', userName = 'Warehouse Lead'): boolean {
  const qty = Number(quantity);
  if (qty <= 0) throw new Error('Quantity must be greater than 0');
  if (fromLocationId === toLocationId) throw new Error('Source and destination locations cannot be identical');

  const now = new Date().toISOString();

  const fromRecord = db.prepare('SELECT * FROM inventory WHERE product_id = ? AND location_id = ?').get(productId, fromLocationId) as any;
  if (!fromRecord || (fromRecord.quantity - fromRecord.reserved_quantity) < qty) {
    throw new Error('Insufficient unreserved stock available in source location');
  }

  // Deduct from source
  const newFromQty = fromRecord.quantity - qty;
  if (newFromQty === 0 && fromRecord.reserved_quantity === 0) {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(fromRecord.id);
  } else {
    db.prepare('UPDATE inventory SET quantity = ?, updated_at = ? WHERE id = ?').run(newFromQty, now, fromRecord.id);
  }
  db.prepare('UPDATE locations SET current_capacity = MAX(0, current_capacity - ?) WHERE id = ?').run(qty, fromLocationId);

  // Add to destination
  const toRecord = db.prepare('SELECT * FROM inventory WHERE product_id = ? AND location_id = ?').get(productId, toLocationId) as any;
  if (toRecord) {
    db.prepare('UPDATE inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?').run(qty, now, toRecord.id);
  } else {
    const invId = `inv-${Date.now()}`;
    db.prepare('INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, batch_lot, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
      .run(invId, productId, toLocationId, qty, fromRecord.batch_lot || 'TRANSFER', now);
  }
  db.prepare('UPDATE locations SET current_capacity = current_capacity + ? WHERE id = ?').run(qty, toLocationId);

  // Log movement
  db.prepare(`
    INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
    VALUES (?, 'BIN_TRANSFER', ?, ?, ?, ?, 'INTERNAL_TRANSFER', 'TRF-${Date.now()}', ?, ?, ?)
  `).run(`mov-${Date.now()}`, productId, fromLocationId, toLocationId, qty, userName, reason, now);

  return true;
}

export function getLocations(zone?: string, type?: string): (Location & { storedItems: InventoryItem[] })[] {
  let query = `SELECT * FROM locations WHERE 1=1`;
  const params: any[] = [];

  if (zone && zone !== 'ALL') {
    query += ` AND zone = ?`;
    params.push(zone);
  }

  if (type && type !== 'ALL') {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY code ASC`;
  const locations = db.prepare(query).all(...params) as Location[];

  return locations.map(loc => {
    const storedItems = db.prepare(`
      SELECT 
        i.*,
        p.sku,
        p.name as product_name,
        p.barcode,
        p.category,
        p.uom
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.location_id = ? AND i.quantity > 0
    `).all(loc.id) as InventoryItem[];

    return {
      ...loc,
      items_count: storedItems.length,
      storedItems
    };
  });
}

export function createLocation(data: {
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  type: string;
  max_capacity: number;
}): Location {
  const id = `loc-${Date.now()}`;
  db.prepare(`
    INSERT INTO locations (id, code, zone, aisle, rack, shelf, bin, type, max_capacity, current_capacity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE')
  `).run(
    id,
    data.code.trim().toUpperCase(),
    data.zone,
    data.aisle.trim().toUpperCase(),
    data.rack.trim().toUpperCase(),
    data.shelf.trim().toUpperCase(),
    data.bin.trim().toUpperCase(),
    data.type || 'STORAGE',
    Number(data.max_capacity) || 100
  );
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as Location;
}

export function getSuppliers(): Supplier[] {
  const rows = db.prepare(`
    SELECT 
      s.*,
      COUNT(po.id) as active_pos_count
    FROM suppliers s
    LEFT JOIN inbound_orders po ON s.id = po.supplier_id AND po.status IN ('EXPECTED', 'RECEIVING')
    GROUP BY s.id
    ORDER BY s.name ASC
  `).all() as Supplier[];
  return rows;
}

export function createSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'active_pos_count'>): Supplier {
  const id = `sup-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO suppliers (id, name, code, contact_name, email, phone, address, lead_time_days, payment_terms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.code.trim().toUpperCase(),
    data.contact_name.trim(),
    data.email.trim(),
    data.phone.trim(),
    data.address.trim(),
    Number(data.lead_time_days) || 7,
    data.payment_terms || 'Net 30',
    now
  );
  return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
}

export function getCustomers(): Customer[] {
  const rows = db.prepare(`
    SELECT 
      c.*,
      COUNT(so.id) as total_orders_count
    FROM customers c
    LEFT JOIN outbound_orders so ON c.id = so.customer_id
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all() as Customer[];
  return rows;
}

export function createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'total_orders_count'>): Customer {
  const id = `cust-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO customers (id, name, code, contact_name, email, phone, shipping_address, city, country, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.code.trim().toUpperCase(),
    data.contact_name.trim(),
    data.email.trim(),
    data.phone.trim(),
    data.shipping_address.trim(),
    data.city.trim(),
    data.country.trim(),
    now
  );
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer;
}

export function getInboundOrders(status?: string): InboundOrder[] {
  let query = `
    SELECT 
      po.*,
      s.name as supplier_name,
      s.code as supplier_code
    FROM inbound_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'ALL') {
    query += ` AND po.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY po.created_at DESC`;

  const orders = db.prepare(query).all(...params) as InboundOrder[];

  return orders.map(order => {
    const items = db.prepare(`
      SELECT 
        poi.*,
        p.sku,
        p.name as product_name,
        p.barcode,
        p.uom,
        l.code as target_location_code
      FROM inbound_order_items poi
      JOIN products p ON poi.product_id = p.id
      LEFT JOIN locations l ON poi.target_location_id = l.id
      WHERE poi.inbound_order_id = ?
    `).all(order.id) as InboundOrderItem[];

    return {
      ...order,
      items
    };
  });
}

export function createInboundOrder(data: {
  supplier_id: string;
  po_number: string;
  expected_date: string;
  notes?: string;
  items: { product_id: string; expected_qty: number; target_location_id?: string; unit_cost: number; batch_lot?: string }[];
}): InboundOrder {
  const id = `po-${Date.now()}`;
  const now = new Date().toISOString();
  const totalItems = data.items.reduce((sum, item) => sum + Number(item.expected_qty), 0);
  const totalCost = data.items.reduce((sum, item) => sum + (Number(item.expected_qty) * Number(item.unit_cost)), 0);

  db.prepare(`
    INSERT INTO inbound_orders (id, po_number, supplier_id, status, expected_date, total_items, total_cost, notes, created_at)
    VALUES (?, ?, ?, 'EXPECTED', ?, ?, ?, ?, ?)
  `).run(
    id,
    data.po_number.trim().toUpperCase(),
    data.supplier_id,
    data.expected_date,
    totalItems,
    totalCost,
    data.notes || '',
    now
  );

  const insertItem = db.prepare(`
    INSERT INTO inbound_order_items (id, inbound_order_id, product_id, expected_qty, received_qty, target_location_id, batch_lot, unit_cost)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `);

  data.items.forEach((item, idx) => {
    insertItem.run(
      `poi-${Date.now()}-${idx}`,
      id,
      item.product_id,
      Number(item.expected_qty),
      item.target_location_id || null,
      item.batch_lot || `LOT-${new Date().getFullYear()}-${idx + 1}`,
      Number(item.unit_cost) || 0
    );
  });

  return getInboundOrders().find(o => o.id === id)!;
}

export function receiveInboundItems(orderId: string, receivedUpdates: { itemId: string; receivedQty: number; putawayLocationId: string; batchLot?: string }[], userName = 'Receiving Lead'): boolean {
  const now = new Date().toISOString();
  const order = db.prepare('SELECT * FROM inbound_orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new Error('Inbound Order not found');

  let allCompleted = true;

  receivedUpdates.forEach(update => {
    const item = db.prepare('SELECT * FROM inbound_order_items WHERE id = ?').get(update.itemId) as any;
    if (!item) return;

    const newlyReceived = Math.max(0, Number(update.receivedQty));
    if (newlyReceived <= 0) return;

    const updatedReceivedQty = item.received_qty + newlyReceived;
    if (updatedReceivedQty < item.expected_qty) {
      allCompleted = false;
    }

    db.prepare(`
      UPDATE inbound_order_items SET
        received_qty = ?,
        target_location_id = ?,
        batch_lot = COALESCE(?, batch_lot)
      WHERE id = ?
    `).run(updatedReceivedQty, update.putawayLocationId, update.batchLot || null, update.itemId);

    // Increase Inventory
    const inv = db.prepare('SELECT * FROM inventory WHERE product_id = ? AND location_id = ?').get(item.product_id, update.putawayLocationId) as any;
    if (inv) {
      db.prepare('UPDATE inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?').run(newlyReceived, now, inv.id);
    } else {
      const invId = `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      db.prepare('INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, batch_lot, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
        .run(invId, item.product_id, update.putawayLocationId, newlyReceived, update.batchLot || item.batch_lot || 'INBOUND', now);
    }

    db.prepare('UPDATE locations SET current_capacity = current_capacity + ? WHERE id = ?').run(newlyReceived, update.putawayLocationId);

    // Log movement
    db.prepare(`
      INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
      VALUES (?, 'INBOUND_RECEIPT', ?, NULL, ?, ?, 'INBOUND_PO', ?, ?, 'Inbound dock receipt & putaway', ?)
    `).run(`mov-${Date.now()}-${Math.random().toString(36).substring(7)}`, item.product_id, update.putawayLocationId, newlyReceived, order.po_number, userName, now);
  });

  const nextStatus = allCompleted ? 'RECEIVED' : 'RECEIVING';
  db.prepare('UPDATE inbound_orders SET status = ?, received_date = ? WHERE id = ?').run(nextStatus, now, orderId);

  return true;
}

export function getOutboundOrders(status?: string): OutboundOrder[] {
  let query = `
    SELECT 
      so.*,
      c.name as customer_name,
      c.code as customer_code
    FROM outbound_orders so
    JOIN customers c ON so.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'ALL') {
    query += ` AND so.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY 
    CASE so.priority 
      WHEN 'URGENT' THEN 1 
      WHEN 'HIGH' THEN 2 
      WHEN 'NORMAL' THEN 3 
      ELSE 4 
    END ASC,
    so.created_at DESC
  `;

  const orders = db.prepare(query).all(...params) as OutboundOrder[];

  return orders.map(order => {
    const items = db.prepare(`
      SELECT 
        soi.*,
        p.sku,
        p.name as product_name,
        p.barcode,
        p.uom,
        l.code as source_location_code,
        (SELECT COALESCE(SUM(quantity - reserved_quantity), 0) FROM inventory WHERE product_id = soi.product_id) as available_in_stock
      FROM outbound_order_items soi
      JOIN products p ON soi.product_id = p.id
      LEFT JOIN locations l ON soi.source_location_id = l.id
      WHERE soi.outbound_order_id = ?
    `).all(order.id) as OutboundOrderItem[];

    const totalItems = items.reduce((sum, i) => sum + i.ordered_qty, 0);
    const totalValue = items.reduce((sum, i) => sum + (i.ordered_qty * i.unit_price), 0);

    return {
      ...order,
      total_items: totalItems,
      total_value: Math.round(totalValue * 100) / 100,
      items
    };
  });
}

export function createOutboundOrder(data: {
  customer_id: string;
  order_number: string;
  priority: string;
  carrier?: string;
  shipping_address: string;
  notes?: string;
  items: { product_id: string; ordered_qty: number; unit_price: number; source_location_id?: string }[];
}): OutboundOrder {
  const id = `so-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO outbound_orders (id, order_number, customer_id, priority, status, carrier, shipping_address, notes, created_at)
    VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
  `).run(
    id,
    data.order_number.trim().toUpperCase(),
    data.customer_id,
    data.priority || 'NORMAL',
    data.carrier || 'Standard Ground',
    data.shipping_address.trim(),
    data.notes || '',
    now
  );

  const insertItem = db.prepare(`
    INSERT INTO outbound_order_items (id, outbound_order_id, product_id, ordered_qty, picked_qty, source_location_id, unit_price)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);

  data.items.forEach((item, idx) => {
    const qty = Number(item.ordered_qty);
    // Find primary location if not provided
    let locId = item.source_location_id;
    if (!locId) {
      const primaryLoc = db.prepare('SELECT location_id FROM inventory WHERE product_id = ? AND quantity > 0 LIMIT 1').get(item.product_id) as any;
      locId = primaryLoc ? primaryLoc.location_id : null;
    }

    insertItem.run(
      `soi-${Date.now()}-${idx}`,
      id,
      item.product_id,
      qty,
      locId,
      Number(item.unit_price) || 0
    );

    // Reserve quantity in inventory
    if (locId) {
      db.prepare('UPDATE inventory SET reserved_quantity = reserved_quantity + ? WHERE product_id = ? AND location_id = ?')
        .run(qty, item.product_id, locId);
    }
  });

  return getOutboundOrders().find(o => o.id === id)!;
}

export function pickOutboundItems(orderId: string, pickedUpdates: { itemId: string; pickedQty: number }[], userName = 'Picking Lead'): boolean {
  const now = new Date().toISOString();
  const order = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new Error('Outbound order not found');

  let allPicked = true;

  pickedUpdates.forEach(update => {
    const item = db.prepare('SELECT * FROM outbound_order_items WHERE id = ?').get(update.itemId) as any;
    if (!item) return;

    const count = Math.min(item.ordered_qty, Number(update.pickedQty));
    if (count < item.ordered_qty) {
      allPicked = false;
    }

    db.prepare('UPDATE outbound_order_items SET picked_qty = ? WHERE id = ?').run(count, update.itemId);
  });

  const nextStatus = allPicked ? 'PACKED' : 'PICKING';
  db.prepare('UPDATE outbound_orders SET status = ? WHERE id = ?').run(nextStatus, orderId);

  return true;
}

export function shipOutboundOrder(orderId: string, carrier: string, trackingNumber: string, userName = 'Shipping Lead'): boolean {
  const now = new Date().toISOString();
  const order = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new Error('Outbound order not found');

  const items = db.prepare('SELECT * FROM outbound_order_items WHERE outbound_order_id = ?').all(orderId) as any[];

  // Deduct actual stock from inventory & release reservation
  items.forEach(item => {
    const qtyToShip = item.picked_qty > 0 ? item.picked_qty : item.ordered_qty;
    const inv = db.prepare('SELECT * FROM inventory WHERE product_id = ? AND location_id = ?').get(item.product_id, item.source_location_id) as any;

    if (inv) {
      const remainingQty = Math.max(0, inv.quantity - qtyToShip);
      const remainingRes = Math.max(0, inv.reserved_quantity - qtyToShip);

      if (remainingQty === 0 && remainingRes === 0) {
        db.prepare('DELETE FROM inventory WHERE id = ?').run(inv.id);
      } else {
        db.prepare('UPDATE inventory SET quantity = ?, reserved_quantity = ?, updated_at = ? WHERE id = ?').run(remainingQty, remainingRes, now, inv.id);
      }
      db.prepare('UPDATE locations SET current_capacity = MAX(0, current_capacity - ?) WHERE id = ?').run(qtyToShip, item.source_location_id);
    }

    // Log movement
    db.prepare(`
      INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
      VALUES (?, 'OUTBOUND_SHIP', ?, ?, NULL, ?, 'OUTBOUND_SO', ?, ?, 'Customer shipment dispatch', ?)
    `).run(`mov-${Date.now()}-${Math.random().toString(36).substring(7)}`, item.product_id, item.source_location_id, qtyToShip, order.order_number, userName, now);
  });

  db.prepare(`
    UPDATE outbound_orders SET
      status = 'SHIPPED',
      carrier = ?,
      tracking_number = ?,
      shipped_at = ?
    WHERE id = ?
  `).run(carrier, trackingNumber, now, orderId);

  return true;
}

export function getStockMovements(limit = 50, productId?: string, type?: string): StockMovement[] {
  let query = `
    SELECT 
      sm.*,
      p.sku,
      p.name as product_name,
      fl.code as from_location_code,
      tl.code as to_location_code
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN locations fl ON sm.from_location_id = fl.id
    LEFT JOIN locations tl ON sm.to_location_id = tl.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (productId) {
    query += ` AND sm.product_id = ?`;
    params.push(productId);
  }

  if (type && type !== 'ALL') {
    query += ` AND sm.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY sm.created_at DESC LIMIT ?`;
  params.push(limit);

  return db.prepare(query).all(...params) as StockMovement[];
}

export function resetDatabase(): boolean {
  seedDemoData();
  return true;
}
