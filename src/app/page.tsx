import React from 'react';
import { getDashboardData } from '@/lib/actions';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { OccupancyWidget } from '@/components/dashboard/OccupancyWidget';
import { ActivityStream } from '@/components/dashboard/ActivityStream';
import { InboundOutboundWidget } from '@/components/dashboard/InboundOutboundWidget';
import { Warehouse, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Warehouse Operations Center</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
              Live Facility
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            OmniHub Chicago Central Distribution Facility (WH-CHI-01) • 4 Storage Zones • Real-Time Inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Manage SKUs
          </Link>
          <Link
            href="/scanner"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <span>Scan Barcode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <KpiCards stats={stats} />

      {/* Grid: Zone Occupancy + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <OccupancyWidget zoneOccupancy={stats.zoneOccupancy} occupancyRate={stats.occupancyRate} />
        </div>
        <div className="lg:col-span-7">
          <ActivityStream movements={stats.recentMovements} />
        </div>
      </div>

      {/* Inbound & Outbound Queues */}
      <InboundOutboundWidget inboundOrders={stats.recentInbound} outboundOrders={stats.recentOutbound} />
    </div>
  );
}
