'use client';

import React from 'react';
import { InboundOrder, OutboundOrder } from '@/lib/types';
import { ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface InboundOutboundWidgetProps {
  inboundOrders: InboundOrder[];
  outboundOrders: OutboundOrder[];
}

export function InboundOutboundWidget({ inboundOrders, outboundOrders }: InboundOutboundWidgetProps) {
  const getInboundBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'RECEIVING':
        return <Badge variant="info" size="sm">In Dock</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Expected</Badge>;
    }
  };

  const getOutboundBadge = (status: string, priority: string) => {
    if (priority === 'URGENT') return <Badge variant="danger" size="sm">Urgent</Badge>;
    switch (status) {
      case 'SHIPPED':
        return <Badge variant="success" size="sm">Shipped</Badge>;
      case 'PACKED':
        return <Badge variant="purple" size="sm">Packed</Badge>;
      case 'PICKING':
        return <Badge variant="warning" size="sm">Picking</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Pending</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inbound Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Inbound Receiving Queue</h3>
          </div>
          <Link
            href="/inbound"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>All POs</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {inboundOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No inbound orders in queue</div>
          ) : (
            inboundOrders.map((po) => (
              <Link
                key={po.id}
                href="/inbound"
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors group block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{po.po_number}</span>
                    {getInboundBadge(po.status)}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{po.supplier_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900">{po.total_items} items</div>
                  <div className="text-[11px] text-slate-400">{po.expected_date}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Outbound Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Outbound Dispatch Queue</h3>
          </div>
          <Link
            href="/outbound"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>All Orders</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {outboundOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No outbound orders in queue</div>
          ) : (
            outboundOrders.map((so) => (
              <Link
                key={so.id}
                href="/outbound"
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors group block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{so.order_number}</span>
                    {getOutboundBadge(so.status, so.priority)}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{so.customer_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900">${so.total_value?.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">{so.carrier || 'Ground'}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
