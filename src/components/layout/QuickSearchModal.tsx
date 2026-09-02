'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { lookupBarcodeOrSkuAction, getProductsAction } from '@/lib/actions';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getProductsAction(query.trim());
        setResults(data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center p-4 pt-20 no-print animate-in fade-in duration-100">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div 
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search SKUs, product names, categories, or scan barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-none outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Type an SKU code (e.g. <span className="font-mono text-slate-600 font-semibold">SKU-IND-4010</span>), item name, or scan a barcode
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No inventory products found matching &ldquo;<span className="text-slate-700 font-medium">{query}</span>&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/inventory?sku=${product.sku}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 font-mono">{product.sku}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{product.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{product.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {product.total_stock} <span className="text-[10px] text-slate-500 font-normal">{product.uom}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {product.primary_location || 'Unassigned'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
