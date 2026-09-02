'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product, Location } from '@/lib/types';
import { transferStockAction } from '@/lib/actions';
import { ArrowRightLeft, Check, AlertCircle } from 'lucide-react';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  locations: Location[];
  onSuccess?: () => void;
}

export function TransferStockModal({ isOpen, onClose, product, locations, onSuccess }: TransferStockModalProps) {
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState('Bin Optimization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (product && locations.length >= 2) {
      setFromLoc(locations[0].id);
      setToLoc(locations[1].id);
      setQuantity(5);
      setError('');
    }
  }, [product, locations, isOpen]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLoc === toLoc) {
      setError('Source and target locations must be different');
      return;
    }
    if (quantity <= 0) {
      setError('Transfer quantity must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await transferStockAction(
        product.id,
        fromLoc,
        toLoc,
        quantity,
        reason,
        'Warehouse Lead'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Relocate Stock Between Bins"
      subtitle={`SKU: ${product.sku} — ${product.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">From Source Bin</label>
            <select
              value={fromLoc}
              onChange={(e) => setFromLoc(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-2 outline-none focus:border-slate-500 font-mono"
              required
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">To Destination Bin</label>
            <select
              value={toLoc}
              onChange={(e) => setToLoc(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-2 outline-none focus:border-slate-500 font-mono"
              required
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.zone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Quantity to Relocate ({product.uom})
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transfer Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
          >
            <option value="Bin Space Optimization">Bin Space Optimization</option>
            <option value="Moving to Fast-Picking Zone">Moving to Fast-Picking Zone</option>
            <option value="Consolidation">Consolidation</option>
            <option value="Damaged Rack Relocation">Damaged Rack Relocation</option>
          </select>
        </div>

        {/* Buttons */}
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
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{loading ? 'Transferring...' : 'Execute Bin Transfer'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
