'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product } from '@/lib/types';
import { generateBarcodeSVG, generateQrSVG } from '@/lib/barcode';
import { Printer, Copy, Check } from 'lucide-react';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function BarcodeLabelModal({ isOpen, onClose, product }: BarcodeLabelModalProps) {
  const [copied, setCopied] = useState(false);
  const [labelCopies, setLabelCopies] = useState(1);

  if (!product) return null;

  const barcodeSvg = generateBarcodeSVG(product.barcode || product.sku, 48, 2);
  const qrSvg = generateQrSVG(product.barcode || product.sku, 80);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Inventory Label & Barcode"
      subtitle={`SKU: ${product.sku} — ${product.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Label Area */}
        <div className="flex justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
          <div
            id="printable-label"
            className="w-80 bg-white border border-slate-300 rounded-lg p-4 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:w-full"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-2 mb-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">OmniFlow WMS</div>
                <div className="text-sm font-bold font-mono text-slate-900">{product.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-slate-500">LOCATION</div>
                <div className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {product.primary_location || 'UNASSIGNED'}
                </div>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-800 line-clamp-2 mb-3 leading-snug">
              {product.name}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div
                className="flex-1 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              <div
                className="shrink-0"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
              <span>UOM: <strong className="text-slate-800">{product.uom}</strong></span>
              <span>CAT: <strong className="text-slate-800">{product.category}</strong></span>
              <span>CODE: <strong className="text-slate-800 font-mono">{product.barcode}</strong></span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <button
            onClick={handleCopyBarcode}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Barcode' : 'Copy Barcode String'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label (Direct)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
