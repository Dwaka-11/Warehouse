import React from 'react';
import { getMovementsAction } from '@/lib/actions';
import { AuditLogView } from '@/components/movements/AuditLogView';

export const dynamic = 'force-dynamic';

export default async function MovementsPage() {
  const movements = await getMovementsAction(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement & Audit Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete, chronological immutable trail of all inbound receipts, dispatches, bin relocations, and stock corrections.
        </p>
      </div>

      <AuditLogView initialMovements={movements} />
    </div>
  );
}
