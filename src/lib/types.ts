export type UnitOfMeasure = 'PCS' | 'BOX' | 'PLT' | 'KG' | 'L' | 'M' | 'SET';

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  barcode: string;
  uom: UnitOfMeasure;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  weight_kg?: number;
  dimensions_cm?: string;
  created_at: string;
  updated_at: string;
  // Computed fields from inventory
  total_stock?: number;
  reserved_stock?: number;
  available_stock?: number;
  locations_count?: number;
  primary_location?: string;
  status?: ProductStatus;
}

export type LocationType = 'STORAGE' | 'RECEIVING' | 'SHIPPING' | 'PICKING' | 'STAGING' | 'DAMAGED';
export type LocationStatus = 'ACTIVE' | 'FULL' | 'MAINTENANCE' | 'LOCKED';

export interface Location {
  id: string;
  code: string; // e.g., "Z-A-01-R01-S02-B01"
  zone: string; // "Zone A - High Velocity", "Zone B - Bulk Pallet", "Zone C - Cold Storage", "Zone D - Receiving"
  aisle: string; // "A01", "A02"
  rack: string; // "R01", "R02"
  shelf: string; // "S01", "S02"
  bin: string; // "B01", "B02"
  type: LocationType;
  max_capacity: number;
  current_capacity: number;
  status: LocationStatus;
  items_count?: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  batch_lot?: string;
  expiry_date?: string;
  updated_at: string;
  // Joined details
  sku?: string;
  product_name?: string;
  category?: string;
  barcode?: string;
  uom?: UnitOfMeasure;
  location_code?: string;
  zone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  lead_time_days: number;
  payment_terms: string;
  created_at: string;
  active_pos_count?: number;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contact_name: string;
  email: string;
  phone: string;
  shipping_address: string;
  city: string;
  country: string;
  created_at: string;
  total_orders_count?: number;
}

export type InboundStatus = 'EXPECTED' | 'RECEIVING' | 'RECEIVED' | 'CANCELLED';

export interface InboundOrderItem {
  id: string;
  inbound_order_id: string;
  product_id: string;
  expected_qty: number;
  received_qty: number;
  target_location_id?: string;
  batch_lot?: string;
  unit_cost: number;
  // Joined fields
  sku?: string;
  product_name?: string;
  barcode?: string;
  uom?: UnitOfMeasure;
  target_location_code?: string;
}

export interface InboundOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: InboundStatus;
  expected_date: string;
  received_date?: string;
  total_items: number;
  total_cost?: number;
  notes?: string;
  created_at: string;
  supplier_name?: string;
  supplier_code?: string;
  items?: InboundOrderItem[];
}

export type OutboundPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type OutboundStatus = 'PENDING' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OutboundOrderItem {
  id: string;
  outbound_order_id: string;
  product_id: string;
  ordered_qty: number;
  picked_qty: number;
  source_location_id?: string;
  unit_price: number;
  // Joined fields
  sku?: string;
  product_name?: string;
  barcode?: string;
  uom?: UnitOfMeasure;
  source_location_code?: string;
  available_in_stock?: number;
}

export interface OutboundOrder {
  id: string;
  order_number: string;
  customer_id: string;
  priority: OutboundPriority;
  status: OutboundStatus;
  carrier?: string;
  tracking_number?: string;
  shipping_address: string;
  notes?: string;
  created_at: string;
  shipped_at?: string;
  customer_name?: string;
  customer_code?: string;
  total_items?: number;
  total_value?: number;
  items?: OutboundOrderItem[];
}

export type MovementType = 'INBOUND_RECEIPT' | 'OUTBOUND_PICK' | 'OUTBOUND_SHIP' | 'BIN_TRANSFER' | 'STOCK_ADJUSTMENT' | 'CYCLE_COUNT' | 'INITIAL_SEED';

export interface StockMovement {
  id: string;
  type: MovementType;
  product_id: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  user_name: string;
  reason?: string;
  created_at: string;
  // Joined fields
  sku?: string;
  product_name?: string;
  from_location_code?: string;
  to_location_code?: string;
}

export interface DashboardStats {
  totalSkus: number;
  totalStockUnits: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingInboundCount: number;
  pendingOutboundCount: number;
  totalLocationsCount: number;
  occupiedLocationsCount: number;
  occupancyRate: number;
  zoneOccupancy: {
    zone: string;
    totalBins: number;
    occupiedBins: number;
    rate: number;
  }[];
  recentMovements: StockMovement[];
  recentInbound: InboundOrder[];
  recentOutbound: OutboundOrder[];
}
