'use client';

import React from 'react';
import { Layers, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface OccupancyWidgetProps {
  zoneOccupancy: {
    zone: string;
    totalBins: number;
    occupiedBins: number;
    rate: number;
  }[];
  occupancyRate: number;
}

export function OccupancyWidget({ zoneOccupancy, occupancyRate }: OccupancyWidgetProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Facility Capacity by Zone</h3>
          </div>
          <Link
            href="/locations"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 group"
          >
            <span>View Map</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Global summary progress */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Overall Warehouse Utilization</div>
            <div className="text-base font-bold text-slate-900">{occupancyRate}% <span className="text-xs font-normal text-slate-500">of storage bins allocated</span></div>
          </div>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Breakdown by zone */}
        <div className="space-y-3">
          {zoneOccupancy.map((zone, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{zone.zone}</span>
                <span className="text-slate-500 font-mono">
                  {zone.occupiedBins} / {zone.totalBins} bins ({zone.rate}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-300"
                  style={{ width: `${zone.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Optimal (&lt;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Moderate (70-85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>High (&gt;85%)</span>
        </div>
      </div>
    </div>
  );
}
