import React from 'react';
import { getLocationsAction, getProductsAction } from '@/lib/actions';
import { BarcodeScannerView } from '@/components/scanner/BarcodeScannerView';

export const dynamic = 'force-dynamic';

export default async function ScannerPage() {
  const locations = await getLocationsAction();
  const products = await getProductsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Optical Scan & Barcode Station</h1>
        <p className="text-xs text-slate-500 mt-1">
          Instant SKU lookup, real-time inventory adjustments, bin transfers, and high-resolution label printing.
        </p>
      </div>

      <BarcodeScannerView
        locations={locations}
        sampleProducts={products}
      />
    </div>
  );
}
