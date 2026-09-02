'use client';

import React, { useState } from 'react';
import { InboundOrder, Supplier, Product, Location } from '@/lib/types';
import {
  ArrowDownToLine,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  PackageCheck,
  Building,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createInboundOrderAction, receiveInboundItemsAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface InboundListProps {
  initialOrders: InboundOrder[];
  suppliers: Supplier[];
  products: Product[];
  locations: Location[];
}

export function InboundList({ initialOrders, suppliers, products, locations }: InboundListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receivingModalOrder, setReceivingModalOrder] = useState<InboundOrder | null>(null);
  const [manifestPrintOrder, setManifestPrintOrder] = useState<InboundOrder | null>(null);

  const filteredOrders = initialOrders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch =
      search === '' ||
      o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.supplier_name && o.supplier_name.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="success">Completed</Badge>;
      case 'RECEIVING':
        return <Badge variant="info">In Dock Receiving</Badge>;
      case 'EXPECTED':
        return <Badge variant="warning">Expected Arrival</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
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
              placeholder="Search PO number or supplier..."
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
            <option value="ALL">All PO Statuses</option>
            <option value="EXPECTED">Expected Only</option>
            <option value="RECEIVING">In Receiving</option>
            <option value="RECEIVED">Received & Putaway</option>
          </select>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Create Inbound PO</span>
        </button>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items / SKU Count</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4">PO Valuation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ArrowDownToLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">No purchase orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-sm">{order.po_number}</div>
                      <div className="text-[11px] text-slate-400">Created {order.created_at.slice(0, 10)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.supplier_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.supplier_code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.total_items} units</div>
                      <div className="text-[11px] text-slate-400">{order.items?.length || 0} line items</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{order.expected_date}</div>
                      {order.received_date && (
                        <div className="text-[11px] text-emerald-600">Received {order.received_date.slice(0, 10)}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ${order.total_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status !== 'RECEIVED' ? (
                          <button
                            onClick={() => setReceivingModalOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Check-In</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => setManifestPrintOrder(order)}
                          className="p-1 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
                          title="Print PO Manifest Docket"
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

      {/* Create Inbound PO Modal */}
      <CreateInboundModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        suppliers={suppliers}
        products={products}
        locations={locations}
        onSuccess={() => router.refresh()}
      />

      {/* Receive Inbound Order Modal */}
      <ReceivingWorkflowModal
        isOpen={!!receivingModalOrder}
        onClose={() => setReceivingModalOrder(null)}
        order={receivingModalOrder}
        locations={locations}
        onSuccess={() => router.refresh()}
      />

      {/* Printable Inbound Manifest */}
      <InboundManifestModal
        isOpen={!!manifestPrintOrder}
        onClose={() => setManifestPrintOrder(null)}
        order={manifestPrintOrder}
      />
    </div>
  );
}

function CreateInboundModal({
  isOpen,
  onClose,
  suppliers,
  products,
  locations,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  locations: Location[];
  onSuccess?: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [poNumber, setPoNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<{ productId: string; qty: number; unitCost: number; locationId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const random = Math.floor(1000 + Math.random() * 9000);
      setPoNumber(`PO-2026-${random}`);
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setExpectedDate(d.toISOString().slice(0, 10));
      if (products.length > 0) {
        setLines([
          {
            productId: products[0].id,
            qty: 50,
            unitCost: products[0].cost_price,
            locationId: locations[0]?.id || ''
          }
        ]);
      }
      setError('');
    }
  }, [isOpen, products, locations]);

  const addLine = () => {
    if (products.length > 0) {
      setLines([
        ...lines,
        {
          productId: products[0].id,
          qty: 25,
          unitCost: products[0].cost_price,
          locationId: locations[0]?.id || ''
        }
      ]);
    }
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !poNumber || lines.length === 0) {
      setError('Please fill in required fields and at least one line item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createInboundOrderAction({
        supplier_id: supplierId,
        po_number: poNumber,
        expected_date: expectedDate,
        notes,
        items: lines.map(l => ({
          product_id: l.productId,
          expected_qty: l.qty,
          unit_cost: l.unitCost,
          target_location_id: l.locationId
        }))
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Inbound Purchase Order (PO)"
      subtitle="Register expected incoming freight from suppliers"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Supplier Partner</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">PO Number</label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Delivery Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Line Items</span>
            <button
              type="button"
              onClick={addLine}
              className="text-xs text-slate-900 font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item Line</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-5">
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const p = products.find(prod => prod.id === e.target.value);
                      const updated = [...lines];
                      updated[idx].productId = e.target.value;
                      if (p) updated[idx].unitCost = p.cost_price;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none font-mono"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
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
                    placeholder="Cost $"
                    value={line.unitCost}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].unitCost = parseFloat(e.target.value) || 0;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <select
                    value={line.locationId}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].locationId = e.target.value;
                      setLines(updated);
                    }}
                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none font-mono"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.code}</option>
                    ))}
                  </select>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Dock Receiving Notes</label>
          <input
            type="text"
            placeholder="e.g. Standard 40ft freight delivery, requires forklift on arrival"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
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
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? 'Creating PO...' : 'Create Purchase Order'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReceivingWorkflowModal({
  isOpen,
  onClose,
  order,
  locations,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  order: InboundOrder | null;
  locations: Location[];
  onSuccess?: () => void;
}) {
  const [receives, setReceives] = useState<{ itemId: string; receivedQty: number; putawayLocationId: string; batchLot: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (order && order.items) {
      setReceives(
        order.items.map(i => ({
          itemId: i.id,
          receivedQty: Math.max(0, i.expected_qty - i.received_qty),
          putawayLocationId: i.target_location_id || locations[0]?.id || '',
          batchLot: i.batch_lot || `LOT-${new Date().getFullYear()}-IN`
        }))
      );
      setError('');
    }
  }, [order, locations, isOpen]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await receiveInboundItemsAction(order.id, receives, 'Dock Receiving Lead');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to check-in freight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inbound Goods Receiving & Putaway"
      subtitle={`Verify freight arrival for PO: ${order.po_number} (${order.supplier_name})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {order.items?.map((item, idx) => {
            const currentRec = receives[idx] || { receivedQty: 0, putawayLocationId: '', batchLot: '' };
            return (
              <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-xs">{item.sku}</span>
                      <span className="text-xs text-slate-500 font-medium">{item.product_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Barcode: {item.barcode}</div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500">Expected:</span> <strong className="text-slate-900">{item.expected_qty}</strong> {item.uom}
                    <div className="text-[11px] text-emerald-600">Already Received: {item.received_qty}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Qty Arrived Now ({item.uom})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.expected_qty - item.received_qty}
                      value={currentRec.receivedQty}
                      onChange={(e) => {
                        const updated = [...receives];
                        updated[idx].receivedQty = parseInt(e.target.value, 10) || 0;
                        setReceives(updated);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Putaway Bin</label>
                    <select
                      value={currentRec.putawayLocationId}
                      onChange={(e) => {
                        const updated = [...receives];
                        updated[idx].putawayLocationId = e.target.value;
                        setReceives(updated);
                      }}
                      className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none font-mono"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.code} ({l.zone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lot / Batch #</label>
                    <input
                      type="text"
                      value={currentRec.batchLot}
                      onChange={(e) => {
                        const updated = [...receives];
                        updated[idx].batchLot = e.target.value;
                        setReceives(updated);
                      }}
                      className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none font-mono"
                    />
                  </div>
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
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing Receipt...' : 'Confirm Receipt & Putaway'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InboundManifestModal({ isOpen, onClose, order }: { isOpen: boolean; onClose: () => void; order: InboundOrder | null }) {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inbound Receiving Slip & Docket"
      subtitle={`PO: ${order.po_number}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div id="printable-manifest" className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-sm font-bold text-slate-900 font-mono">{order.po_number}</div>
              <div className="text-slate-500 font-medium">INBOUND FREIGHT RECEIVING MANIFEST</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800">OmniFlow Warehouse WH-CHI-01</div>
              <div className="text-slate-400 text-[11px]">{order.expected_date}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">SUPPLIER</span>
              <div className="font-bold text-slate-900">{order.supplier_name}</div>
              <div className="text-slate-500 font-mono text-[11px]">{order.supplier_code}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">STATUS</span>
              <div className="font-bold text-slate-900">{order.status}</div>
              <div className="text-slate-500 text-[11px]">{order.total_items} total items</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 font-semibold text-[10px] text-slate-500 uppercase">
                <th className="py-2">SKU</th>
                <th className="py-2">Item Name</th>
                <th className="py-2">Expected</th>
                <th className="py-2">Received</th>
                <th className="py-2">Putaway Bin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map(i => (
                <tr key={i.id}>
                  <td className="py-2 font-mono font-bold text-slate-900">{i.sku}</td>
                  <td className="py-2 text-slate-700">{i.product_name}</td>
                  <td className="py-2 font-semibold">{i.expected_qty} {i.uom}</td>
                  <td className="py-2 font-semibold text-emerald-700">{i.received_qty} {i.uom}</td>
                  <td className="py-2 font-mono text-slate-600">{i.target_location_code || 'Staging Dock'}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <span>Print Manifest</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
