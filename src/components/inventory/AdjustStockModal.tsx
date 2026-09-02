'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product, Location } from '@/lib/types';
import { adjustStockAction } from '@/lib/actions';
import { Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  locations: Location[];
  onSuccess?: () => void;
}

export function AdjustStockModal({ isOpen, onClose, product, locations, onSuccess }: AdjustStockModalProps) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [mode, setMode] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState('Cycle Count');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (product && locations.length > 0) {
      setSelectedLocation(locations[0].id);
      setAmount(10);
      setMode('ADD');
      setError('');
    }
  }, [product, locations, isOpen]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError('Please select a storage location');
      return;
    }
    if (amount <= 0 && mode !== 'SET') {
      setError('Quantity must be greater than 0');
      return;
    }

    let delta = amount;
    if (mode === 'SUBTRACT') delta = -amount;

    setLoading(true);
    setError('');

    try {
      await adjustStockAction(
        product.id,
        selectedLocation,
        delta,
        `${reason}${notes ? `: ${notes}` : ''}`,
        'Warehouse Lead'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
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

        {/* Current stock indicator */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-600">Current Total On Hand:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{product.total_stock} {product.uom}</span>
        </div>

        {/* Location selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Warehouse Bin Location <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500 font-mono"
            required
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.code} ({loc.zone}) — {loc.current_capacity}/{loc.max_capacity} cap
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('ADD')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                mode === 'ADD'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('SUBTRACT')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                mode === 'SUBTRACT'
                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Deduct Stock (-)</span>
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Quantity ({product.uom}) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
            className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
          >
            <option value="Cycle Count Verification">Cycle Count Verification</option>
            <option value="Damaged / Write-off">Damaged / Write-off</option>
            <option value="Supplier Discrepancy Correction">Supplier Discrepancy Correction</option>
            <option value="Customer Return Stock In">Customer Return Stock In</option>
            <option value="Expired Stock Removal">Expired Stock Removal</option>
            <option value="Found Unrecorded Stock">Found Unrecorded Stock</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Audit Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Verified by physical count in shelf A02"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
          />
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
            <Check className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving Adjustment...' : 'Apply Stock Adjustment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
