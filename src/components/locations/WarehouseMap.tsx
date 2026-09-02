'use client';

import React, { useState } from 'react';
import { Location, InventoryItem } from '@/lib/types';
import {
  MapPin,
  Layers,
  Box,
  Plus,
  ArrowRightLeft,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createLocationAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface WarehouseMapProps {
  locations: (Location & { storedItems: InventoryItem[] })[];
}

export function WarehouseMap({ locations }: WarehouseMapProps) {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedLoc, setSelectedLoc] = useState<(Location & { storedItems: InventoryItem[] }) | null>(null);
  const [addLocModalOpen, setAddLocModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group locations by zone
  const zones = Array.from(new Set(locations.map(l => l.zone)));

  const filteredLocations = locations.filter(l => {
    const matchZone = selectedZone === 'ALL' || l.zone === selectedZone;
    const matchSearch =
      searchQuery === '' ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.storedItems.some(i => i.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || i.product_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchZone && matchSearch;
  });

  const getOccupancyColor = (current: number, max: number) => {
    if (current === 0) return 'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-400';
    const ratio = current / max;
    if (ratio >= 0.9) return 'bg-rose-50 border-rose-300 text-rose-800 hover:border-rose-400';
    if (ratio >= 0.5) return 'bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-400';
    return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:border-emerald-400';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Zone Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setSelectedZone('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                selectedZone === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Zones ({locations.length})
            </button>
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  selectedZone === z ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {z.split(' - ')[0]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find bin or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => setAddLocModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Add Location Bin</span>
        </button>
      </div>

      {/* 2D Interactive Warehouse Floor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bin Matrix */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Floor Layout & Bin Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click on any bin cell to inspect current stored inventory</p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                <span>Empty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>&lt;50%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                <span>50-90%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
                <span>&gt;90% Full</span>
              </div>
            </div>
          </div>

          {/* Render Bins by Zone */}
          {zones.filter(z => selectedZone === 'ALL' || z === selectedZone).map(zoneName => {
            const zoneBins = filteredLocations.filter(l => l.zone === zoneName);
            if (zoneBins.length === 0) return null;

            return (
              <div key={zoneName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{zoneName}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium font-mono">{zoneBins.length} locations</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {zoneBins.map(loc => {
                    const isSelected = selectedLoc?.id === loc.id;
                    const occClass = getOccupancyColor(loc.current_capacity, loc.max_capacity);
                    const percent = Math.round((loc.current_capacity / loc.max_capacity) * 100);

                    return (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLoc(loc)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${occClass} ${
                          isSelected ? 'ring-2 ring-slate-900 ring-offset-1 shadow-xs' : ''
                        }`}
                      >
                        <div className="text-[11px] font-bold font-mono truncate">{loc.code}</div>
                        <div className="flex items-center justify-between text-[10px] mt-1.5 font-medium">
                          <span>{percent}%</span>
                          <span className="font-normal">{loc.storedItems.length} SKUs</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Selected Bin Inspector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">Bin Location Inspector</h3>
              </div>
              {selectedLoc && <Badge variant="neutral" size="sm">{selectedLoc.type}</Badge>}
            </div>

            {selectedLoc ? (
              <div className="space-y-4">
                {/* Bin Code & Zone */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500 font-medium">LOCATION CODE</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{selectedLoc.code}</div>
                  <div className="text-xs text-slate-600 mt-1">{selectedLoc.zone}</div>

                  <div className="mt-3 pt-3 border-t border-slate-200/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Capacity Utilization:</span>
                      <span className="font-bold text-slate-900">
                        {selectedLoc.current_capacity} / {selectedLoc.max_capacity} units ({Math.round((selectedLoc.current_capacity / selectedLoc.max_capacity) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${Math.min(100, (selectedLoc.current_capacity / selectedLoc.max_capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stored Products in this Bin */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Stored Inventory ({selectedLoc.storedItems.length} items)
                  </h4>

                  {selectedLoc.storedItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                      This bin location is currently empty.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedLoc.storedItems.map((item) => (
                        <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 font-mono">{item.sku}</span>
                            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                              {item.quantity} {item.uom}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.product_name}</p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>Lot: {item.batch_lot || 'N/A'}</span>
                            <span>Barcode: {item.barcode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-600">No Location Selected</p>
                <p className="text-[11px] text-slate-400 mt-1">Select any bin from the warehouse map to view stored SKUs and capacity</p>
              </div>
            )}
          </div>

          {selectedLoc && (
            <div className="mt-6 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 text-center">
                Aisle: <strong className="text-slate-700">{selectedLoc.aisle}</strong> • Rack: <strong className="text-slate-700">{selectedLoc.rack}</strong> • Shelf: <strong className="text-slate-700">{selectedLoc.shelf}</strong> • Bin: <strong className="text-slate-700">{selectedLoc.bin}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={addLocModalOpen}
        onClose={() => setAddLocModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function AddLocationModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [zone, setZone] = useState('Zone A - High Velocity');
  const [aisle, setAisle] = useState('A04');
  const [rack, setRack] = useState('R01');
  const [shelf, setShelf] = useState('S01');
  const [bin, setBin] = useState('B01');
  const [type, setType] = useState('STORAGE');
  const [maxCapacity, setMaxCapacity] = useState('150');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generatedCode = `Z${zone.charAt(5)}-${aisle}-${rack}-${shelf}-${bin}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createLocationAction({
        code: generatedCode,
        zone,
        aisle,
        rack,
        shelf,
        bin,
        type,
        max_capacity: parseInt(maxCapacity, 10) || 100
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Warehouse Storage Bin"
      subtitle="Define coordinates and capacity for a new storage rack or bin"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-600">Generated Bin Code:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{generatedCode}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Warehouse Zone</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
          >
            <option value="Zone A - High Velocity">Zone A - High Velocity Goods</option>
            <option value="Zone B - Bulk Pallet">Zone B - Bulk Pallet Storage</option>
            <option value="Zone C - Cold Storage">Zone C - Cold Storage / Hazardous</option>
            <option value="Zone D - Staging & Dock">Zone D - Staging & Dock</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Aisle</label>
            <input
              type="text"
              value={aisle}
              onChange={(e) => setAisle(e.target.value.toUpperCase())}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rack</label>
            <input
              type="text"
              value={rack}
              onChange={(e) => setRack(e.target.value.toUpperCase())}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shelf</label>
            <input
              type="text"
              value={shelf}
              onChange={(e) => setShelf(e.target.value.toUpperCase())}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bin</label>
            <input
              type="text"
              value={bin}
              onChange={(e) => setBin(e.target.value.toUpperCase())}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
            >
              <option value="STORAGE">STORAGE</option>
              <option value="RECEIVING">RECEIVING</option>
              <option value="SHIPPING">SHIPPING</option>
              <option value="PICKING">PICKING</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Unit Capacity</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
              required
            />
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
            <span>{loading ? 'Creating...' : 'Register Bin Location'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
