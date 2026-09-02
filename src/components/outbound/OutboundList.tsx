'use client';

import React, { useState } from 'react';
import { OutboundOrder, Customer, Product, Location } from '@/lib/types';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  CheckSquare,
  Truck,
  AlertCircle,
  Package,
  Barcode
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createOutboundOrderAction, pickOutboundItemsAction, shipOutboundOrderAction } from '@/lib/actions';
import { generateBarcodeSVG, generateQrSVG } from '@/lib/barcode';
import { useRouter } from 'next/navigation';

interface OutboundListProps {
  initialOrders: OutboundOrder[];
  customers: Customer[];
  products: Product[];
  locations: Location[];
}

export function OutboundList({ initialOrders, customers, products, locations }: OutboundListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pickingOrder, setPickingOrder] = useState<OutboundOrder | null>(null);
  const [shippingOrder, setShippingOrder] = useState<OutboundOrder | null>(null);
  const [slipOrder, setSlipOrder] = useState<OutboundOrder | null>(null);

  const filteredOrders = initialOrders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch =
      search === '' ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: string, priority: string) => {
    switch (status) {
      case 'SHIPPED':
        return <Badge variant="success">Shipped</Badge>;
      case 'PACKED':
        return <Badge variant="purple">Packed & Ready</Badge>;
      case 'PICKING':
        return <Badge variant="warning">In Picking</Badge>;
      case 'PENDING':
        return <Badge variant="neutral">Pending Pick</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger" size="sm">Urgent Priority</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="PICKING">In Picking</option>
            <option value="PACKED">Packed / Staged</option>
            <option value="SHIPPED">Shipped Out</option>
          </select>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>New Outbound Order</span>
        </button>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Priority & Items</th>
                <th className="py-3 px-4">Carrier & Tracking</th>
                <th className="py-3 px-4">Order Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ArrowUpFromLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">No outbound orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-sm">{order.order_number}</div>
                      <div className="text-[11px] text-slate-400">{order.created_at.slice(0, 10)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.customer_name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{order.shipping_address}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(order.priority)}
                        <span className="font-semibold text-slate-900">{order.total_items} units</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{order.items?.length || 0} line items</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{order.carrier || 'Ground Express'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.tracking_number || 'Pending'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ${order.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status, order.priority)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'PENDING' || order.status === 'PICKING' ? (
                          <button
                            onClick={() => setPickingOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Pick Items</span>
                          </button>
                        ) : null}

                        {order.status === 'PACKED' ? (
                          <button
                            onClick={() => setShippingOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shadow-2xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => setSlipOrder(order)}
                          className="p-1 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
                          title="Print Packing Slip & Shipping Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateOutboundModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        customers={customers}
        products={products}
        onSuccess={() => router.refresh()}
      />

      <PickWorkflowModal
        isOpen={!!pickingOrder}
        onClose={() => setPickingOrder(null)}
        order={pickingOrder}
        onSuccess={() => router.refresh()}
      />

      <ShipDispatchModal
        isOpen={!!shippingOrder}
        onClose={() => setShippingOrder(null)}
        order={shippingOrder}
        onSuccess={() => router.refresh()}
      />

      <PackingSlipModal
        isOpen={!!slipOrder}
        onClose={() => setSlipOrder(null)}
        order={slipOrder}
      />
    </div>
  );
}

function CreateOutboundModal({
  isOpen,
  onClose,
  customers,
  products,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  onSuccess?: () => void;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [orderNumber, setOrderNumber] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [carrier, setCarrier] = useState('FedEx Ground');
  const [address, setAddress] = useState('');
  const [lines, setLines] = useState<{ productId: string; qty: number; unitPrice: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const random = Math.floor(1000 + Math.random() * 9000);
      setOrderNumber(`SO-2026-${random}`);
      if (customers.length > 0) {
        setCustomerId(customers[0].id);
        setAddress(customers[0].shipping_address);
      }
      if (products.length > 0) {
        setLines([
          {
            productId: products[0].id,
            qty: 2,
            unitPrice: products[0].selling_price
          }
        ]);
      }
      setError('');
    }
  }, [isOpen, customers, products]);

  const addLine = () => {
    if (products.length > 0) {
      setLines([
        ...lines,
        {
          productId: products[0].id,
          qty: 1,
          unitPrice: products[0].selling_price
        }
      ]);
    }
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !orderNumber || lines.length === 0) {
      setError('Please fill in required fields and at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createOutboundOrderAction({
        customer_id: customerId,
        order_number: orderNumber,
        priority,
        carrier,
        shipping_address: address,
        items: lines.map(l => ({
          product_id: l.productId,
          ordered_qty: l.qty,
          unit_price: l.unitPrice
        }))
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create outbound order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Outbound Dispatch Order (SO)"
      subtitle="Schedule order fulfillment, allocate inventory and set priority"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = customers.find(cust => cust.id === e.target.value);
                if (c) setAddress(c.shipping_address);
              }}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fulfillment Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Express</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shipping Carrier</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
            >
              <option value="FedEx Ground">FedEx Ground</option>
              <option value="UPS Next Day Air">UPS Next Day Air</option>
              <option value="DHL Express Freight">DHL Express Freight</option>
              <option value="USPS Priority">USPS Priority</option>
              <option value="Internal Transfer Truck">Internal Transfer Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination Shipping Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Requested Items</span>
            <button
              type="button"
              onClick={addLine}
              className="text-xs text-slate-900 font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SKU Line</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-7">
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const p = products.find(prod => prod.id === e.target.value);
                      const updated = [...lines];
                      updated[idx].productId = e.target.value;
                      if (p) updated[idx].unitPrice = p.selling_price;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none font-mono"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.name} ({p.available_stock || 0} avail)</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={line.qty}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].qty = parseInt(e.target.value, 10) || 0;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price $"
                    value={line.unitPrice}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none"
                  />
                </div>

                <div className="col-span-1 text-right">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-slate-400 hover:text-rose-600 font-bold text-base"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? 'Creating Order...' : 'Submit Outbound Order'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PickWorkflowModal({
  isOpen,
  onClose,
  order,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  order: OutboundOrder | null;
  onSuccess?: () => void;
}) {
  const [picks, setPicks] = useState<{ itemId: string; pickedQty: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (order && order.items) {
      setPicks(
        order.items.map(i => ({
          itemId: i.id,
          pickedQty: i.ordered_qty
        }))
      );
      setError('');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await pickOutboundItemsAction(order.id, picks, 'Picking Lead');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm pick');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guided Wave / Order Picking"
      subtitle={`Pick items for order: ${order.order_number} (${order.customer_name})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
          <span>Guided Picking Route: Follow bin sequence from top to bottom.</span>
          <span className="font-bold text-slate-900 font-mono">{order.items?.length} picks required</span>
        </div>

        <div className="space-y-3">
          {order.items?.map((item, idx) => {
            const currentPick = picks[idx] || { pickedQty: 0 };
            return (
              <div key={item.id} className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-xs text-slate-900">{item.sku}</span>
                    <span className="text-xs text-slate-600">{item.product_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>Source Bin: <strong className="font-mono text-slate-800 bg-slate-100 px-1 rounded">{item.source_location_code || 'Pick Staging'}</strong></span>
                    <span>•</span>
                    <span>Barcode: <strong className="font-mono text-slate-800">{item.barcode}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="text-slate-400">Target:</span> <strong className="text-slate-900">{item.ordered_qty} {item.uom}</strong>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.ordered_qty}
                    value={currentPick.pickedQty}
                    onChange={(e) => {
                      const updated = [...picks];
                      updated[idx].pickedQty = parseInt(e.target.value, 10) || 0;
                      setPicks(updated);
                    }}
                    className="w-20 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none text-center"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{loading ? 'Confirming Pick...' : 'Mark Picked & Move to Pack'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ShipDispatchModal({
  isOpen,
  onClose,
  order,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  order: OutboundOrder | null;
  onSuccess?: () => void;
}) {
  const [carrier, setCarrier] = useState(order?.carrier || 'FedEx Ground');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (order) {
      setCarrier(order.carrier || 'FedEx Ground');
      setTrackingNumber(`TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setError('');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await shipOutboundOrderAction(order.id, carrier, trackingNumber, 'Shipping Lead');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to ship order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch & Ship Outbound Freight"
      subtitle={`Handover order ${order.order_number} to logistics carrier`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Destination Customer:</span>
            <span className="font-bold text-slate-900">{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Address:</span>
            <span className="font-medium text-slate-700">{order.shipping_address}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Carrier / Transport Partner</label>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Master Tracking / BOL Number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{loading ? 'Dispatching...' : 'Confirm Freight Dispatch'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PackingSlipModal({ isOpen, onClose, order }: { isOpen: boolean; onClose: () => void; order: OutboundOrder | null }) {
  if (!order) return null;

  const barcodeSvg = generateBarcodeSVG(order.order_number, 40, 2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Packing Slip & Shipping Bill"
      subtitle={`Order: ${order.order_number}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div id="printable-slip" className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-sm font-bold text-slate-900 font-mono">{order.order_number}</div>
              <div className="text-slate-500 font-medium">OFFICIAL WAREHOUSE PACKING SLIP</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800">OmniFlow WH-CHI-01</div>
              <div className="text-slate-400 text-[11px]">{order.created_at.slice(0, 10)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">SHIP TO</span>
              <div className="font-bold text-slate-900">{order.customer_name}</div>
              <div className="text-slate-600 text-[11px]">{order.shipping_address}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">CARRIER & TRACKING</span>
              <div className="font-bold text-slate-900">{order.carrier || 'Ground Express'}</div>
              <div className="text-slate-600 font-mono text-[11px]">{order.tracking_number || 'Awaiting dispatch'}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 font-semibold text-[10px] text-slate-500 uppercase">
                <th className="py-2">SKU</th>
                <th className="py-2">Product Description</th>
                <th className="py-2">Ordered</th>
                <th className="py-2">Picked</th>
                <th className="py-2 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map(i => (
                <tr key={i.id}>
                  <td className="py-2 font-mono font-bold text-slate-900">{i.sku}</td>
                  <td className="py-2 text-slate-700">{i.product_name}</td>
                  <td className="py-2 font-semibold">{i.ordered_qty} {i.uom}</td>
                  <td className="py-2 font-semibold text-purple-700">{i.picked_qty} {i.uom}</td>
                  <td className="py-2 text-right font-mono">${i.unit_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="w-48" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
            <div className="text-right">
              <div className="text-slate-500 text-[11px]">Total Declared Value</div>
              <div className="text-base font-bold text-slate-900">${order.total_value?.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Packing Slip</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
