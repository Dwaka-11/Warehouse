import React from 'react';
import { getProductsAction, getLocationsAction } from '@/lib/actions';
import { InventoryTable } from '@/components/inventory/InventoryTable';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; status?: string };
}) {
  const products = await getProductsAction();
  const locations = await getLocationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory SKU Catalog</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete master inventory records, stock level thresholds, pricing, and bin location assignments.
        </p>
      </div>

      <InventoryTable
        initialProducts={products}
        locations={locations}
        initialCategory={searchParams.category || 'ALL'}
        initialStatus={searchParams.status || 'ALL'}
      />
    </div>
  );
}
