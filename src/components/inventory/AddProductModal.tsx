'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Location } from '@/lib/types';
import { createProductAction } from '@/lib/actions';
import { Plus, Wand2, AlertCircle } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onSuccess?: () => void;
}

export function AddProductModal({ isOpen, onClose, locations, onSuccess }: AddProductModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [barcode, setBarcode] = useState('');
  const [uom, setUom] = useState('PCS');
  const [costPrice, setCostPrice] = useState('25.00');
  const [sellingPrice, setSellingPrice] = useState('55.00');
  const [minStock, setMinStock] = useState('10');
  const [maxStock, setMaxStock] = useState('200');
  const [initialLocation, setInitialLocation] = useState('');
  const [initialQty, setInitialQty] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      handleGenerateSKU();
      if (locations.length > 0) {
        setInitialLocation(locations[0].id);
      }
      setError('');
    }
  }, [isOpen, locations]);

  const handleGenerateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `SKU-${category.substring(0, 3).toUpperCase()}-${random}`;
    const generatedBarcode = `890123${random}`;
    setSku(generatedSku);
    setBarcode(generatedBarcode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !barcode.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProductAction({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        category,
        barcode: barcode.trim(),
        uom,
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        min_stock: parseInt(minStock, 10) || 10,
        max_stock: parseInt(maxStock, 10) || 500,
        initial_location_id: initialLocation || undefined,
        initial_quantity: parseInt(initialQty, 10) || 0
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product SKU');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Inventory SKU"
      subtitle="Register a new catalog item, set stock thresholds and assign initial bin"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SKU Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSKU}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                <Wand2 className="w-3 h-3" />
                <span>Generate</span>
              </button>
            </div>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. SKU-AUT-5520"
              className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Barcode / EAN-13 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8901235520"
              className="w-full text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Product Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Optical Distance Sensor 24V DC"
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Industrial grade sensor with IO-Link interface"
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="Automation">Automation</option>
              <option value="Electronics">Electronics</option>
              <option value="Safety">Safety & PPE</option>
              <option value="Packaging">Packaging</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Chemicals">Chemicals & Lubricants</option>
              <option value="Lighting">Lighting</option>
              <option value="Tools">Tools & Equipment</option>
            </select>
          </div>

          {/* Unit of Measure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit of Measure (UOM)</label>
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="PCS">PCS (Pieces / Eaches)</option>
              <option value="BOX">BOX (Box / Case)</option>
              <option value="SET">SET (Set / Bundle)</option>
              <option value="PLT">PLT (Full Pallet)</option>
              <option value="KG">KG (Kilograms)</option>
              <option value="L">L (Liters)</option>
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit Selling Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Min Reorder Point</label>
            <input
              type="number"
              min="1"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Stock Capacity</label>
            <input
              type="number"
              min="1"
              value={maxStock}
              onChange={(e) => setMaxStock(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500"
            />
          </div>
        </div>

        {/* Initial Stock */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="text-xs font-bold text-slate-900">Initial Stock Onboarding (Optional)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assign Initial Bin</label>
              <select
                value={initialLocation}
                onChange={(e) => setInitialLocation(e.target.value)}
                className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none font-mono"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} ({loc.zone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Initial Quantity</label>
              <input
                type="number"
                min="0"
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
                className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
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
            <span>{loading ? 'Creating SKU...' : 'Save & Register SKU'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
