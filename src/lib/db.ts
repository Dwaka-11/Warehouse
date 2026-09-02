import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'warehouse.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

let isInitialized = false;

export function initDatabase() {
  if (isInitialized) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      uom TEXT NOT NULL DEFAULT 'PCS',
      cost_price REAL NOT NULL DEFAULT 0.0,
      selling_price REAL NOT NULL DEFAULT 0.0,
      min_stock INTEGER NOT NULL DEFAULT 10,
      max_stock INTEGER NOT NULL DEFAULT 500,
      weight_kg REAL DEFAULT 1.0,
      dimensions_cm TEXT DEFAULT '20x15x10',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      aisle TEXT NOT NULL,
      rack TEXT NOT NULL,
      shelf TEXT NOT NULL,
      bin TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'STORAGE',
      max_capacity INTEGER NOT NULL DEFAULT 100,
      current_capacity INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved_quantity INTEGER NOT NULL DEFAULT 0,
      batch_lot TEXT,
      expiry_date TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      UNIQUE(product_id, location_id, batch_lot)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      lead_time_days INTEGER NOT NULL DEFAULT 7,
      payment_terms TEXT NOT NULL DEFAULT 'Net 30',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inbound_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT UNIQUE NOT NULL,
      supplier_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'EXPECTED',
      expected_date TEXT NOT NULL,
      received_date TEXT,
      total_items INTEGER NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS inbound_order_items (
      id TEXT PRIMARY KEY,
      inbound_order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      expected_qty INTEGER NOT NULL,
      received_qty INTEGER NOT NULL DEFAULT 0,
      target_location_id TEXT,
      batch_lot TEXT,
      unit_cost REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (inbound_order_id) REFERENCES inbound_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (target_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS outbound_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      status TEXT NOT NULL DEFAULT 'PENDING',
      carrier TEXT,
      tracking_number TEXT,
      shipping_address TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      shipped_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS outbound_order_items (
      id TEXT PRIMARY KEY,
      outbound_order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      ordered_qty INTEGER NOT NULL,
      picked_qty INTEGER NOT NULL DEFAULT 0,
      source_location_id TEXT,
      unit_price REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (outbound_order_id) REFERENCES outbound_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (source_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      product_id TEXT NOT NULL,
      from_location_id TEXT,
      to_location_id TEXT,
      quantity INTEGER NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      user_name TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (from_location_id) REFERENCES locations(id),
      FOREIGN KEY (to_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    seedDemoData();
  }

  isInitialized = true;
}

export function seedDemoData() {
  const now = new Date().toISOString();

  // Execute in single transaction
  const seedTx = db.transaction(() => {
    db.pragma('foreign_keys = OFF');

    db.exec(`
      DELETE FROM stock_movements;
      DELETE FROM outbound_order_items;
      DELETE FROM outbound_orders;
      DELETE FROM inbound_order_items;
      DELETE FROM inbound_orders;
      DELETE FROM inventory;
      DELETE FROM locations;
      DELETE FROM products;
      DELETE FROM suppliers;
      DELETE FROM customers;
      DELETE FROM settings;
    `);

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (id, name, code, contact_name, email, phone, address, lead_time_days, payment_terms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const suppliers = [
      ['sup-1', 'Apex Industrial Dynamics', 'SUP-101', 'Marcus Vance', 'orders@apexindustrial.com', '+1 (555) 234-5678', '8400 Warehouse Blvd, Chicago, IL', 5, 'Net 30', now],
      ['sup-2', 'Nordic Silicon & Microelectronics', 'SUP-102', 'Astrid Lind', 'b2b@nordicsilicon.com', '+1 (555) 345-6789', '12 Silicon Valley Way, San Jose, CA', 7, 'Net 15', now],
      ['sup-3', 'Titan Heavy Packaging & Pallets', 'SUP-103', 'Dave Miller', 'supply@titanpackaging.com', '+1 (555) 456-7890', '900 Logistics Way, Atlanta, GA', 3, 'Net 30', now],
      ['sup-4', 'BioSafe Protection & PPE', 'SUP-104', 'Elena Rostova', 'sales@biosafeglobal.com', '+1 (555) 567-8901', '45 Medical Drive, Boston, MA', 4, 'Net 45', now],
      ['sup-5', 'Precision Motors & Robotics', 'SUP-105', 'Kenji Sato', 'dispatch@precisionmotors.jp', '+1 (555) 678-9012', '77 Automation Ave, Detroit, MI', 10, 'Net 30', now]
    ];

    suppliers.forEach(s => insertSupplier.run(...s));

    const insertCustomer = db.prepare(`
      INSERT INTO customers (id, name, code, contact_name, email, phone, shipping_address, city, country, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const customers = [
      ['cust-1', 'Global Logistics Hub Corp', 'CUST-001', 'Sarah Jenkins', 's.jenkins@globallog.com', '+1 (555) 901-2345', '742 Evergreen Terrace', 'Springfield', 'USA', now],
      ['cust-2', 'Vanguard Robotics Inc', 'CUST-002', 'Dr. Aris Thorne', 'operations@vanguardrobotics.io', '+1 (555) 912-3456', '100 Innovation Parkway', 'Austin', 'USA', now],
      ['cust-3', 'Metro Distribution Center', 'CUST-003', 'Carlos Gomez', 'carlos.g@metrodist.com', '+1 (555) 923-4567', '404 Industrial Loop', 'Dallas', 'USA', now],
      ['cust-4', 'Beacon Health Systems', 'CUST-004', 'Rachel Adams', 'r.adams@beaconhealth.org', '+1 (555) 934-5678', '88 Hospital Way', 'Seattle', 'USA', now],
      ['cust-5', 'NextGen Retail Solutions', 'CUST-005', 'Liam Walker', 'inventory@nextgenretail.com', '+1 (555) 945-6789', '210 Commerce Blvd', 'Miami', 'USA', now]
    ];

    customers.forEach(c => insertCustomer.run(...c));

    const insertLocation = db.prepare(`
      INSERT INTO locations (id, code, zone, aisle, rack, shelf, bin, type, max_capacity, current_capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const zones = [
      { code: 'Zone A - High Velocity', prefix: 'ZA', aisles: ['A01', 'A02', 'A03'], type: 'STORAGE', cap: 150 },
      { code: 'Zone B - Bulk Pallet', prefix: 'ZB', aisles: ['B01', 'B02'], type: 'STORAGE', cap: 500 },
      { code: 'Zone C - Cold Storage', prefix: 'ZC', aisles: ['C01', 'C02'], type: 'STORAGE', cap: 100 },
      { code: 'Zone D - Staging & Dock', prefix: 'ZD', aisles: ['D01'], type: 'RECEIVING', cap: 300 }
    ];

    const locationIds: string[] = [];
    let locCounter = 1;

    zones.forEach(z => {
      z.aisles.forEach(aisle => {
        ['R01', 'R02'].forEach(rack => {
          ['S01', 'S02'].forEach(shelf => {
            ['B01', 'B02'].forEach(bin => {
              const locId = `loc-${locCounter}`;
              const code = `${z.prefix}-${aisle}-${rack}-${shelf}-${bin}`;
              insertLocation.run(
                locId,
                code,
                z.code,
                aisle,
                rack,
                shelf,
                bin,
                z.type,
                z.cap,
                0,
                'ACTIVE'
              );
              locationIds.push(locId);
              locCounter++;
            });
          });
        });
      });
    });

    // Staging specific locations
    insertLocation.run('loc-dock-01', 'DOCK-IN-01', 'Zone D - Staging & Dock', 'D01', 'R01', 'S01', 'B01', 'RECEIVING', 500, 0, 'ACTIVE');
    insertLocation.run('loc-dock-02', 'DOCK-OUT-01', 'Zone D - Staging & Dock', 'D01', 'R02', 'S01', 'B01', 'SHIPPING', 500, 0, 'ACTIVE');

    const insertProduct = db.prepare(`
      INSERT INTO products (id, sku, name, description, category, barcode, uom, cost_price, selling_price, min_stock, max_stock, weight_kg, dimensions_cm, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      ['prod-1', 'SKU-IND-4010', 'Industrial Servo Motor 750W', 'High torque brushless motor for CNC and packaging lines', 'Automation', '8901234010', 'PCS', 145.00, 289.00, 15, 100, 3.2, '25x12x12', now, now],
      ['prod-2', 'SKU-ELC-8821', 'Microcontroller Control Board V4', 'ARM Cortex-M7 embedded controller board with CAN bus', 'Electronics', '8901238821', 'PCS', 38.50, 89.90, 30, 250, 0.4, '15x10x3', now, now],
      ['prod-3', 'SKU-PPE-1020', 'High-Dexterity Nitrile Gloves (Box 100)', 'Chemical and puncture resistant industrial grade gloves', 'Safety', '8901231020', 'BOX', 8.20, 18.50, 50, 600, 0.8, '24x12x8', now, now],
      ['prod-4', 'SKU-PKG-9002', 'Heavy Duty Pallet Stretch Film (6pk)', '80-gauge cast stretch wrap rolls for warehouse palletizing', 'Packaging', '8901239002', 'SET', 42.00, 78.00, 20, 150, 14.5, '50x30x30', now, now],
      ['prod-5', 'SKU-SNS-3301', 'Optical Proximity Sensor 24V', 'Infrared diffuse sensor with 300mm detection range', 'Automation', '8901233301', 'PCS', 22.00, 49.50, 25, 200, 0.2, '8x4x4', now, now],
      ['prod-6', 'SKU-SAF-7714', 'Full-Body Fall Protection Harness', 'ANSI certified universal safety harness with dorsal D-ring', 'Safety', '8901237714', 'PCS', 54.00, 115.00, 10, 80, 2.1, '35x25x15', now, now],
      ['prod-7', 'SKU-LUB-5005', 'Synthetic Gear Lubricant 5L', 'High temperature extreme pressure gear oil ISO VG 320', 'Chemicals', '8901235005', 'PCS', 32.50, 68.00, 15, 120, 5.0, '20x15x30', now, now],
      ['prod-8', 'SKU-PWR-1100', 'Industrial Power Supply 24V 20A', 'DIN-rail mounted switching power supply 480W', 'Electronics', '8901231100', 'PCS', 65.00, 139.00, 12, 90, 1.3, '18x12x10', now, now],
      ['prod-9', 'SKU-BER-6204', 'Precision Deep Groove Ball Bearings (10pk)', 'High speed sealed radial ball bearings 20x47x14mm', 'Mechanical', '8901236204', 'SET', 18.00, 44.00, 40, 300, 1.2, '12x12x6', now, now],
      ['prod-10', 'SKU-BAR-9901', 'Wireless 2D Warehouse Barcode Scanner', 'Rugged IP65 Bluetooth scanner with cradle & base', 'Tools', '8901239901', 'PCS', 95.00, 210.00, 8, 50, 0.9, '22x15x10', now, now],
      ['prod-11', 'SKU-BAT-4810', 'Lithium Forklift Battery Cell 48V', 'LiFePO4 high-cycle traction battery module', 'Batteries', '8901234810', 'PCS', 620.00, 1150.00, 5, 25, 32.0, '40x30x25', now, now],
      ['prod-12', 'SKU-TPE-2200', 'Reinforced Filament Packing Tape (36 rolls)', 'Fiberglass cross-weave high tensile strength security tape', 'Packaging', '8901232200', 'BOX', 58.00, 110.00, 15, 100, 11.0, '38x38x25', now, now],
      ['prod-13', 'SKU-HYD-7020', 'Hydraulic Hose Assembly 1/2" 5000 PSI', 'High pressure wire-braided steel hydraulic line 2-meter', 'Mechanical', '8901237020', 'PCS', 27.50, 62.00, 18, 120, 1.8, '30x30x8', now, now],
      ['prod-14', 'SKU-LED-5500', 'High-Bay Industrial LED Luminaire 150W', '20,000 lumen IP65 warehouse flood fixture 5000K daylight', 'Lighting', '8901235500', 'PCS', 48.00, 105.00, 10, 80, 3.5, '35x35x15', now, now],
      ['prod-15', 'SKU-SOL-3030', 'Rosin Core Solder Wire 1kg Reel 60/40', '0.8mm electronics rework and manufacturing solder alloy', 'Electronics', '8901233030', 'PCS', 24.00, 52.00, 20, 150, 1.0, '10x10x8', now, now],
      ['prod-16', 'SKU-VLV-4400', 'Pneumatic Solenoid Valve 5/2-Way', 'Electromagnetic pilot actuated air directional control valve', 'Automation', '8901234400', 'PCS', 31.00, 74.50, 15, 110, 0.5, '14x8x5', now, now]
    ];

    products.forEach(p => insertProduct.run(...p));

    const insertInventory = db.prepare(`
      INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, batch_lot, expiry_date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMovement = db.prepare(`
      INSERT INTO stock_movements (id, type, product_id, from_location_id, to_location_id, quantity, reference_type, reference_id, user_name, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialStockAssignments = [
      { pId: 'prod-1', locIdx: 0, qty: 45, reserved: 4, batch: 'LOT-2026A-01' },
      { pId: 'prod-2', locIdx: 1, qty: 180, reserved: 15, batch: 'LOT-2026A-02' },
      { pId: 'prod-3', locIdx: 2, qty: 320, reserved: 20, batch: 'LOT-2026A-03' },
      { pId: 'prod-4', locIdx: 8, qty: 85, reserved: 10, batch: 'LOT-2026B-01' },
      { pId: 'prod-5', locIdx: 3, qty: 110, reserved: 0, batch: 'LOT-2026A-04' },
      { pId: 'prod-6', locIdx: 4, qty: 35, reserved: 5, batch: 'LOT-2026A-05' },
      { pId: 'prod-7', locIdx: 16, qty: 40, reserved: 2, batch: 'LOT-2026C-01' },
      { pId: 'prod-8', locIdx: 5, qty: 52, reserved: 8, batch: 'LOT-2026A-06' },
      { pId: 'prod-9', locIdx: 6, qty: 140, reserved: 0, batch: 'LOT-2026A-07' },
      { pId: 'prod-10', locIdx: 7, qty: 22, reserved: 2, batch: 'LOT-2026A-08' },
      { pId: 'prod-11', locIdx: 10, qty: 12, reserved: 3, batch: 'LOT-2026B-02' },
      { pId: 'prod-12', locIdx: 11, qty: 65, reserved: 5, batch: 'LOT-2026B-03' },
      { pId: 'prod-13', locIdx: 12, qty: 48, reserved: 0, batch: 'LOT-2026B-04' },
      { pId: 'prod-14', locIdx: 13, qty: 28, reserved: 4, batch: 'LOT-2026B-05' },
      { pId: 'prod-15', locIdx: 14, qty: 75, reserved: 0, batch: 'LOT-2026A-09' },
      { pId: 'prod-16', locIdx: 15, qty: 60, reserved: 6, batch: 'LOT-2026A-10' }
    ];

    initialStockAssignments.forEach((item, idx) => {
      const invId = `inv-${idx + 1}`;
      const locId = locationIds[item.locIdx] || locationIds[0];
      insertInventory.run(invId, item.pId, locId, item.qty, item.reserved, item.batch, null, now);
      db.prepare('UPDATE locations SET current_capacity = current_capacity + ? WHERE id = ?').run(item.qty, locId);

      insertMovement.run(
        `mov-init-${idx + 1}`,
        'INITIAL_SEED',
        item.pId,
        null,
        locId,
        item.qty,
        'SYSTEM',
        'INIT-001',
        'System Admin',
        'Initial warehouse stock onboarding & verification',
        now
      );
    });

    const insertInbound = db.prepare(`
      INSERT INTO inbound_orders (id, po_number, supplier_id, status, expected_date, received_date, total_items, total_cost, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertInboundItem = db.prepare(`
      INSERT INTO inbound_order_items (id, inbound_order_id, product_id, expected_qty, received_qty, target_location_id, batch_lot, unit_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInbound.run('po-1', 'PO-2026-8901', 'sup-1', 'EXPECTED', '2026-09-08', null, 50, 7250.00, 'Urgent restocking for assembly line components', now);
    insertInboundItem.run('poi-1', 'po-1', 'prod-1', 50, 0, locationIds[0], 'LOT-2026A-09', 145.00);

    insertInbound.run('po-2', 'PO-2026-8902', 'sup-2', 'RECEIVING', '2026-09-02', null, 150, 5775.00, 'Microcontrollers and power modules arrival dock 1', now);
    insertInboundItem.run('poi-2', 'po-2', 'prod-2', 100, 60, locationIds[1], 'LOT-2026A-10', 38.50);
    insertInboundItem.run('poi-3', 'po-2', 'prod-8', 50, 30, locationIds[5], 'LOT-2026A-11', 65.00);

    insertInbound.run('po-3', 'PO-2026-8890', 'sup-4', 'RECEIVED', '2026-08-28', '2026-08-28', 200, 1640.00, 'PPE safety gear monthly restock', now);
    insertInboundItem.run('poi-4', 'po-3', 'prod-3', 200, 200, locationIds[2], 'LOT-2026A-03', 8.20);

    const insertOutbound = db.prepare(`
      INSERT INTO outbound_orders (id, order_number, customer_id, priority, status, carrier, tracking_number, shipping_address, notes, created_at, shipped_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOutboundItem = db.prepare(`
      INSERT INTO outbound_order_items (id, outbound_order_id, product_id, ordered_qty, picked_qty, source_location_id, unit_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertOutbound.run('so-1', 'SO-2026-1044', 'cust-2', 'URGENT', 'PICKING', 'FedEx Freight', 'TRK-98234120', '100 Innovation Parkway, Austin, TX', 'Express ground delivery - handle with care', now, null);
    insertOutboundItem.run('soi-1', 'so-1', 'prod-1', 4, 2, locationIds[0], 289.00);
    insertOutboundItem.run('soi-2', 'so-1', 'prod-2', 15, 15, locationIds[1], 89.90);
    insertOutboundItem.run('soi-3', 'so-1', 'prod-8', 8, 0, locationIds[5], 139.00);

    insertOutbound.run('so-2', 'SO-2026-1045', 'cust-1', 'NORMAL', 'PENDING', 'UPS Ground', null, '742 Evergreen Terrace, Springfield, IL', 'Standard fulfillment', now, null);
    insertOutboundItem.run('soi-4', 'so-2', 'prod-4', 10, 0, locationIds[8], 78.00);
    insertOutboundItem.run('soi-5', 'so-2', 'prod-6', 5, 0, locationIds[4], 115.00);

    insertOutbound.run('so-3', 'SO-2026-1042', 'cust-3', 'HIGH', 'PACKED', 'DHL Express', 'DHL-55829103', '404 Industrial Loop, Dallas, TX', 'Palletized order in Staging Dock Out', now, null);
    insertOutboundItem.run('soi-6', 'so-3', 'prod-3', 20, 20, locationIds[2], 18.50);
    insertOutboundItem.run('soi-7', 'so-3', 'prod-10', 2, 2, locationIds[7], 210.00);

    insertOutbound.run('so-4', 'SO-2026-1039', 'cust-4', 'NORMAL', 'SHIPPED', 'USPS Priority', 'USPS-88294109', '88 Hospital Way, Seattle, WA', 'Delivered safely to medical dock', '2026-08-30', '2026-08-31');
    insertOutboundItem.run('soi-8', 'so-4', 'prod-3', 50, 50, locationIds[2], 18.50);

    insertMovement.run('mov-1', 'INBOUND_RECEIPT', 'prod-3', 'loc-dock-01', locationIds[2], 200, 'INBOUND_PO', 'PO-2026-8890', 'Elena Rostova', 'Received from BioSafe Protection', now);
    insertMovement.run('mov-2', 'OUTBOUND_SHIP', 'prod-3', locationIds[2], 'loc-dock-02', 50, 'OUTBOUND_SO', 'SO-2026-1039', 'Marcus Vance', 'Dispatched to Beacon Health Systems', now);
    insertMovement.run('mov-3', 'BIN_TRANSFER', 'prod-1', locationIds[0], locationIds[1], 5, 'MANUAL_TRANSFER', 'TRF-001', 'Warehouse Lead', 'Optimized picking location reorganization', now);
    insertMovement.run('mov-4', 'STOCK_ADJUSTMENT', 'prod-10', null, locationIds[7], 2, 'CYCLE_COUNT', 'CC-2026-08', 'Auditor Sarah', 'Quarterly inventory audit verification match', now);

    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('warehouse_name', 'OmniHub Central Warehouse Facility');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('warehouse_code', 'WH-CHI-01');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('currency', 'USD');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('address', '4500 Industrial Logistics Pkwy, Chicago, IL 60632');

    db.pragma('foreign_keys = ON');
  });

  seedTx();
}

export default db;
