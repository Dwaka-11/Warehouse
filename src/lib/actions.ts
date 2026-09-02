'use server';

import { revalidatePath } from 'next/cache';
import * as repo from './repository';

export async function getDashboardData() {
  return repo.getDashboardStats();
}

export async function getProductsAction(search?: string, category?: string, status?: string) {
  return repo.getProducts(search, category, status);
}

export async function getProductByIdAction(id: string) {
  return repo.getProductById(id);
}

export async function lookupBarcodeOrSkuAction(query: string) {
  return repo.getProductByBarcodeOrSku(query.trim());
}

export async function createProductAction(formData: {
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
}) {
  const result = repo.createProduct(formData);
  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  return result;
}

export async function updateProductAction(id: string, formData: any) {
  const result = repo.updateProduct(id, formData);
  revalidatePath('/');
  revalidatePath('/inventory');
  return result;
}

export async function deleteProductAction(id: string) {
  const result = repo.deleteProduct(id);
  revalidatePath('/');
  revalidatePath('/inventory');
  return result;
}

export async function adjustStockAction(productId: string, locationId: string, adjustmentQty: number, reason: string, userName?: string) {
  const result = repo.adjustStock(productId, locationId, adjustmentQty, reason, userName);
  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  revalidatePath('/movements');
  return result;
}

export async function transferStockAction(productId: string, fromLocationId: string, toLocationId: string, quantity: number, reason?: string, userName?: string) {
  const result = repo.transferStock(productId, fromLocationId, toLocationId, quantity, reason, userName);
  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  revalidatePath('/movements');
  return result;
}

export async function getLocationsAction(zone?: string, type?: string) {
  return repo.getLocations(zone, type);
}

export async function createLocationAction(data: any) {
  const result = repo.createLocation(data);
  revalidatePath('/locations');
  return result;
}

export async function getSuppliersAction() {
  return repo.getSuppliers();
}

export async function createSupplierAction(data: any) {
  const result = repo.createSupplier(data);
  revalidatePath('/suppliers');
  revalidatePath('/inbound');
  return result;
}

export async function getCustomersAction() {
  return repo.getCustomers();
}

export async function createCustomerAction(data: any) {
  const result = repo.createCustomer(data);
  revalidatePath('/suppliers');
  revalidatePath('/outbound');
  return result;
}

export async function getInboundOrdersAction(status?: string) {
  return repo.getInboundOrders(status);
}

export async function createInboundOrderAction(data: any) {
  const result = repo.createInboundOrder(data);
  revalidatePath('/');
  revalidatePath('/inbound');
  return result;
}

export async function receiveInboundItemsAction(orderId: string, updates: any[], userName?: string) {
  const result = repo.receiveInboundItems(orderId, updates, userName);
  revalidatePath('/');
  revalidatePath('/inbound');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  revalidatePath('/movements');
  return result;
}

export async function getOutboundOrdersAction(status?: string) {
  return repo.getOutboundOrders(status);
}

export async function createOutboundOrderAction(data: any) {
  const result = repo.createOutboundOrder(data);
  revalidatePath('/');
  revalidatePath('/outbound');
  revalidatePath('/inventory');
  return result;
}

export async function pickOutboundItemsAction(orderId: string, pickedUpdates: any[], userName?: string) {
  const result = repo.pickOutboundItems(orderId, pickedUpdates, userName);
  revalidatePath('/');
  revalidatePath('/outbound');
  return result;
}

export async function shipOutboundOrderAction(orderId: string, carrier: string, trackingNumber: string, userName?: string) {
  const result = repo.shipOutboundOrder(orderId, carrier, trackingNumber, userName);
  revalidatePath('/');
  revalidatePath('/outbound');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  revalidatePath('/movements');
  return result;
}

export async function getMovementsAction(limit = 100, productId?: string, type?: string) {
  return repo.getStockMovements(limit, productId, type);
}

export async function resetDatabaseAction() {
  const result = repo.resetDatabase();
  revalidatePath('/');
  revalidatePath('/inventory');
  revalidatePath('/locations');
  revalidatePath('/inbound');
  revalidatePath('/outbound');
  revalidatePath('/movements');
  revalidatePath('/suppliers');
  return result;
}
