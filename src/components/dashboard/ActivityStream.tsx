'use client';

import React from 'react';
import { StockMovement } from '@/lib/types';
import { History, ArrowRight, ArrowDownRight, ArrowUpRight, RefreshCw, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface ActivityStreamProps {
  movements: StockMovement[];
}

export function ActivityStream({ movements }: ActivityStreamProps) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'INBOUND_RECEIPT':
        return <ArrowDownRight className="w-4 h-4 text-emerald-600" />;
      case 'OUTBOUND_SHIP':
      case 'OUTBOUND_PICK':
        return <ArrowUpRight className="w-4 h-4 text-purple-600" />;
      case 'BIN_TRANSFER':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
    }
  };

  const formatTypeLabel = (type: string) => {
    return type.replace('_', ' ').toLowerCase();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Stock Ledger & Activity</h3>
        </div>
        <Link
          href="/movements"
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group"
        >
          <span>Full Audit Log</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {movements.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No stock movements recorded yet.</div>
        ) : (
          movements.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getMovementIcon(m.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 font-mono">{m.sku}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{m.product_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{m.user_name}</span>
                    <span>•</span>
                    <span>{m.reason || m.reference_id || 'Inventory action'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-semibold text-slate-900">
                  {m.type === 'OUTBOUND_SHIP' ? '-' : '+'}{m.quantity} units
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {m.from_location_code ? `${m.from_location_code} → ` : ''}
                  {m.to_location_code || 'Staging'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
