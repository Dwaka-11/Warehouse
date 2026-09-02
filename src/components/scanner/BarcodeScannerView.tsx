'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Location } from '@/lib/types';
import {
  ScanLine,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ArrowRightLeft,
  Barcode,
  Camera,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { lookupBarcodeOrSkuAction, adjustStockAction } from '@/lib/actions';
import { generateBarcodeSVG, generateQrSVG } from '@/lib/barcode';
import { Badge } from '@/components/ui/Badge';
import { BarcodeLabelModal } from '@/components/inventory/BarcodeLabelModal';
import { TransferStockModal } from '@/components/inventory/TransferStockModal';
import { useRouter } from 'next/navigation';

interface BarcodeScannerViewProps {
  locations: Location[];
  sampleProducts: Product[];
}

export function BarcodeScannerView({ locations, sampleProducts }: BarcodeScannerViewProps) {
  const router = useRouter();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<{ code: string; name: string; time: string }[]>([]);

  // Modals
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // USB Barcode Scanner hardware listener (collects rapid keystrokes ending with Enter)
  const keyBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular input
      if (document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'text') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 100) {
        keyBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (keyBuffer.current.length >= 3) {
          handleScanCode(keyBuffer.current);
          keyBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScanCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const product = await lookupBarcodeOrSkuAction(code.trim());
      if (product) {
        setScannedProduct(product);
        setFeedback({ type: 'success', message: `Scanned SKU: ${product.sku} successfully.` });
        setScanHistory(prev => [
          { code: product.barcode, name: product.name, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 9)
        ]);
      } else {
        setFeedback({ type: 'error', message: `No item found matching barcode/SKU: ${code}` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Scan lookup failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdjust = async (delta: number) => {
    if (!scannedProduct) return;
    const targetLoc = locations[0]?.id;
    if (!targetLoc) return;

    setLoading(true);
    try {
      await adjustStockAction(
        scannedProduct.id,
        targetLoc,
        delta,
        `Quick scanner ${delta > 0 ? 'stock-in' : 'stock-out'}`,
        'Scanner Operator'
      );
      setFeedback({
        type: 'success',
        message: `${delta > 0 ? 'Added' : 'Deducted'} ${Math.abs(delta)} units of ${scannedProduct.sku}.`
      });
      // Refresh scanned product
      const updated = await lookupBarcodeOrSkuAction(scannedProduct.sku);
      if (updated) setScannedProduct(updated);
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Stock adjustment failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Header & Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">Barcode & QR Scan Station</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            USB Handheld scanner ready. Point and shoot any 1D barcode or QR code on warehouse shelves.
          </p>
        </div>

        {/* Status Tag */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Hardware Scanner Listening
          </span>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Scanner Input & Camera Emulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Manual Code / Camera Input</h3>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanCode(barcodeInput);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type or paste barcode (e.g. 8901234010)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Scan
              </button>
            </form>

            {/* Camera Viewport Simulation */}
            <div className="relative aspect-4/3 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white">
              {/* Scan Laser Guide Line */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />

              <div className="relative z-10 space-y-2">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-200">Optical Reticle Ready</div>
                <div className="text-[11px] text-slate-400 max-w-xs">
                  Center barcode inside the bounding frame for rapid decoding
                </div>
              </div>

              {/* Reticle Corner Marks */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
            </div>

            {/* Quick Demo Test Chips */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Instant Demo Barcode Targets:</div>
              <div className="flex flex-wrap gap-1.5">
                {sampleProducts.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setBarcodeInput(p.barcode);
                      handleScanCode(p.barcode);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono rounded border border-slate-200 transition-colors"
                  >
                    {p.sku} ({p.barcode})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Scan History */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-900 mb-2">Recent Scans in This Session</h4>
            {scanHistory.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No scans recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {scanHistory.map((h, i) => (
                  <div key={i} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{h.code}</span>
                      <span className="text-slate-500 ml-2 line-clamp-1">{h.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 7 cols: Scanned Product Action Card */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Scanned Item Inspection & Action Panel</h3>
                {scannedProduct && <Badge variant="success">Active SKU Match</Badge>}
              </div>

              {feedback && (
                <div
                  className={`p-3.5 mb-4 rounded-lg border text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {scannedProduct ? (
                <div className="space-y-6">
                  {/* Header details */}
                  <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-slate-900">{scannedProduct.sku}</span>
                        <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded font-medium text-slate-700">
                          {scannedProduct.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-1">{scannedProduct.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{scannedProduct.description || 'No description'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">ASSIGNED BIN</div>
                      <div className="text-sm font-bold font-mono text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded mt-1">
                        {scannedProduct.primary_location || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  {/* Stock metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="text-[11px] text-slate-500">Total Stock On Hand</div>
                      <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                        {scannedProduct.total_stock} <span className="text-xs font-normal text-slate-500">{scannedProduct.uom}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="text-[11px] text-slate-500">Available For Picking</div>
                      <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
                        {scannedProduct.available_stock} <span className="text-xs font-normal text-slate-500">{scannedProduct.uom}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="text-[11px] text-slate-500">Unit Cost / Price</div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        ${scannedProduct.selling_price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Instant Quick Action Controls */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast Execution Triggers</div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleQuickAdjust(1)}
                        disabled={loading}
                        className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Stock In (+1)</span>
                      </button>

                      <button
                        onClick={() => handleQuickAdjust(10)}
                        disabled={loading}
                        className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Stock In (+10)</span>
                      </button>

                      <button
                        onClick={() => handleQuickAdjust(-1)}
                        disabled={loading}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Pick (-1)</span>
                      </button>

                      <button
                        onClick={() => handleQuickAdjust(-5)}
                        disabled={loading}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Pick (-5)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setTransferModalOpen(true)}
                        className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span>Relocate to Another Bin</span>
                      </button>

                      <button
                        onClick={() => setLabelModalOpen(true)}
                        className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Barcode className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print Physical Label</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400">
                  <Barcode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Awaiting Barcode Input</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Scan with a handheld laser reader, select a demo barcode above, or enter an SKU code to start immediate warehouse operations.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>OmniFlow Optical Subsystem</span>
              <span>Code 128 / EAN-13 / QR Decoder Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        product={scannedProduct}
      />

      <TransferStockModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        product={scannedProduct}
        locations={locations}
        onSuccess={async () => {
          if (scannedProduct) {
            const updated = await lookupBarcodeOrSkuAction(scannedProduct.sku);
            if (updated) setScannedProduct(updated);
          }
          router.refresh();
        }}
      />
    </div>
  );
}
