import React from 'react';
import { getSuppliersAction, getCustomersAction } from '@/lib/actions';
import { SuppliersDirectory } from '@/components/suppliers/SuppliersDirectory';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await getSuppliersAction();
  const customers = await getCustomersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Partners & Stakeholders Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage vendor supplier contacts, procurement terms, customer accounts, and delivery destinations.
        </p>
      </div>

      <SuppliersDirectory
        initialSuppliers={suppliers}
        initialCustomers={customers}
      />
    </div>
  );
}
