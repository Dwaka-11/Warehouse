import React from 'react';
import { getLocationsAction } from '@/lib/actions';
import { WarehouseMap } from '@/components/locations/WarehouseMap';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const locations = await getLocationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Warehouse Floor & Bin Map</h1>
        <p className="text-xs text-slate-500 mt-1">
          2D visual layout of storage zones, aisles, racks, and real-time bin capacity utilization.
        </p>
      </div>

      <WarehouseMap locations={locations} />
    </div>
  );
}
