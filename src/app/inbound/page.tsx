import React from 'react';
import { getInboundOrdersAction, getSuppliersAction, getProductsAction, getLocationsAction } from '@/lib/actions';
import { InboundList } from '@/components/inbound/InboundList';

export const dynamic = 'force-dynamic';

export default async function InboundPage() {
  const orders = await getInboundOrdersAction();
  const suppliers = await getSuppliersAction();
  const products = await getProductsAction();
  const locations = await getLocationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbound Receiving & Freight</h1>
        <p className="text-xs text-slate-500 mt-1">
          Purchase orders, dock check-in verification, putaway workflows, and receiving manifests.
        </p>
      </div>

      <InboundList
        initialOrders={orders}
        suppliers={suppliers}
        products={products}
        locations={locations}
      />
    </div>
  );
}
