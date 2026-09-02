'use client';

import React, { useState, useMemo } from 'react';
import { Product, Location } from '@/lib/types';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Download,
  Barcode,
  ArrowRightLeft,
  Package,
  Layers,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { AdjustStockModal } from './AdjustStockModal';
import { TransferStockModal } from './TransferStockModal';
import { AddProductModal } from './AddProductModal';
import { useRouter } from 'next/navigation';

interface InventoryTableProps {
  initialProducts: Product[];
  locations: Location[];
  initialCategory?: string;
  initialStatus?: string;
}

export function InventoryTable({
  initialProducts,
  locations,
  initialCategory = 'ALL',
  initialStatus = 'ALL'
}: InventoryTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => set.add(p.category));
    return ['ALL', ...Array.from(set).sort()];
  }, [initialProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchSearch =
        search === '' ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.toLowerCase()) ||
        (p.primary_location && p.primary_location.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [initialProducts, search, categoryFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Barcode', 'UOM', 'Total Stock', 'Reserved', 'Available', 'Min Stock', 'Max Stock', 'Cost Price', 'Selling Price', 'Primary Bin', 'Status'];
    const rows = filteredProducts.map(p => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.barcode}"`,
      `"${p.uom}"`,
      p.total_stock || 0,
      p.reserved_stock || 0,
      p.available_stock || 0,
      p.min_stock,
      p.max_stock,
      p.cost_price,
      p.selling_price,
      `"${p.primary_location || 'Unassigned'}"`,
      `"${p.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory-export-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge variant="success">In Stock</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="danger">Out of Stock</Badge>;
      case 'OVERSTOCKED':
        return <Badge variant="purple">Overstocked</Badge>;
      default:
        return <Badge variant="neutral">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, product name, barcode, or bin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-slate-300"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-slate-300"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="OVERSTOCKED">Overstocked</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4">Stock Levels</th>
                <th className="py-3 px-4">Primary Bin</th>
                <th className="py-3 px-4">Cost / Selling</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">No inventory products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search terms or filters</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const total = p.total_stock || 0;
                  const available = p.available_stock || 0;
                  const reserved = p.reserved_stock || 0;
                  const percentOfMax = Math.min(100, Math.round((total / p.max_stock) * 100));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Item & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0 text-xs">
                            {p.category.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 font-mono">{p.sku}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {p.category}
                              </span>
                            </div>
                            <div className="text-slate-600 font-medium line-clamp-1 mt-0.5" title={p.name}>
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {p.barcode}
                      </td>

                      {/* Stock Levels */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900">{total} {p.uom}</span>
                          <span className="text-[11px] text-slate-400">
                            {available} avail {reserved > 0 ? `(${reserved} res)` : ''}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              total === 0
                                ? 'bg-rose-500'
                                : total <= p.min_stock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, percentOfMax)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>Min: {p.min_stock}</span>
                          <span>Max: {p.max_stock}</span>
                        </div>
                      </td>

                      {/* Primary Bin */}
                      <td className="py-3.5 px-4">
                        {p.primary_location ? (
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {p.primary_location}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Cost / Selling */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">${p.selling_price.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400">Cost: ${p.cost_price.toFixed(2)}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                            title="Adjust Stock Count (+/-)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setTransferModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                            title="Transfer Between Bins"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setLabelModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                            title="Print Barcode Label"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of <strong className="text-slate-800">{initialProducts.length}</strong> total items
          </div>
          <div className="text-[11px] text-slate-400">
            Click any action button to modify stock, transfer bins, or print high-res labels
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        product={selectedProduct}
      />

      <AdjustStockModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        product={selectedProduct}
        locations={locations}
        onSuccess={() => router.refresh()}
      />

      <TransferStockModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        product={selectedProduct}
        locations={locations}
        onSuccess={() => router.refresh()}
      />

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        locations={locations}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
