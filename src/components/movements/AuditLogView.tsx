'use client';

import React, { useState } from 'react';
import { StockMovement } from '@/lib/types';
import {
  History,
  Search,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AuditLogViewProps {
  initialMovements: StockMovement[];
}

export function AuditLogView({ initialMovements }: AuditLogViewProps) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredMovements = initialMovements.filter(m => {
    const matchType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchSearch =
      search === '' ||
      (m.sku && m.sku.toLowerCase().includes(search.toLowerCase())) ||
      (m.product_name && m.product_name.toLowerCase().includes(search.toLowerCase())) ||
      (m.user_name && m.user_name.toLowerCase().includes(search.toLowerCase())) ||
      (m.reference_id && m.reference_id.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'INBOUND_RECEIPT':
        return <Badge variant="success">Inbound Receipt</Badge>;
      case 'OUTBOUND_SHIP':
        return <Badge variant="purple">Outbound Ship</Badge>;
      case 'OUTBOUND_PICK':
        return <Badge variant="info">Outbound Pick</Badge>;
      case 'BIN_TRANSFER':
        return <Badge variant="neutral">Bin Relocation</Badge>;
      case 'STOCK_ADJUSTMENT':
        return <Badge variant="warning">Stock Adjustment</Badge>;
      case 'CYCLE_COUNT':
        return <Badge variant="neutral">Cycle Count</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Type', 'SKU', 'Product Name', 'Quantity', 'From Location', 'To Location', 'Reference', 'Operator', 'Reason'];
    const rows = filteredMovements.map(m => [
      `"${m.created_at}"`,
      `"${m.type}"`,
      `"${m.sku || ''}"`,
      `"${(m.product_name || '').replace(/"/g, '""')}"`,
      m.quantity,
      `"${m.from_location_code || ''}"`,
      `"${m.to_location_code || ''}"`,
      `"${m.reference_id || ''}"`,
      `"${m.user_name}"`,
      `"${(m.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wms-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, operator, reference # or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="ALL">All Movement Events</option>
            <option value="INBOUND_RECEIPT">Inbound Receipts</option>
            <option value="OUTBOUND_SHIP">Outbound Shipments</option>
            <option value="BIN_TRANSFER">Bin Relocations</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            <option value="INITIAL_SEED">System Initialization</option>
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Item SKU & Product</th>
                <th className="py-3 px-4">Quantity Change</th>
                <th className="py-3 px-4">Bin Route</th>
                <th className="py-3 px-4">Reference Doc</th>
                <th className="py-3 px-4">Authorized Operator</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">No movement entries found</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {m.created_at.replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getMovementBadge(m.type)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">{m.sku}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{m.product_name}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {m.type === 'OUTBOUND_SHIP' ? '-' : '+'}{m.quantity}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {m.from_location_code ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{m.from_location_code}</span>
                      ) : (
                        <span className="text-slate-400">Supplier Dock</span>
                      )}
                      <span className="mx-1 text-slate-400">→</span>
                      {m.to_location_code ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-900">{m.to_location_code}</span>
                      ) : (
                        <span className="text-slate-400">Customer Dispatch</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.reference_id || 'N/A'}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {m.user_name}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={m.reason}>
                      {m.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredMovements.length}</strong> immutable warehouse ledger entries
          </div>
          <div className="text-[11px] text-slate-400">
            All inventory adjustments, receipts, transfers, and shipments are permanently logged.
          </div>
        </div>
      </div>
    </div>
  );
}
