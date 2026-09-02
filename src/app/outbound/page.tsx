import React from 'react';
import { getOutboundOrdersAction, getCustomersAction, getProductsAction, getLocationsAction } from '@/lib/actions';
import { OutboundList } from '@/components/outbound/OutboundList';

export const dynamic = 'force-dynamic';

export default async function OutboundPage() {
  const orders = await getOutboundOrdersAction();
  const customers = await getCustomersAction();
  const products = await getProductsAction();
  const locations = await getLocationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Outbound Fulfillment & Dispatch</h1>
        <p className="text-xs text-slate-500 mt-1">
          Sales orders, wave and order picking, packing verification, shipping slips, and carrier dispatch.
        </p>
      </div>

      <OutboundList
        initialOrders={orders}
        customers={customers}
        products={products}
        locations={locations}
      />
    </div>
  );
}
