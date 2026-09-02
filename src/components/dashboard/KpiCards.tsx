'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Boxes, DollarSign, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Layers } from 'lucide-react';
import Link from 'next/link';

interface KpiCardsProps {
  stats: DashboardStats;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total SKU Catalog',
      value: stats.totalSkus,
      subtitle: `${stats.totalStockUnits.toLocaleString()} units on hand`,
      icon: Boxes,
      href: '/inventory',
      badge: 'Active Catalog',
      badgeColor: 'text-slate-600 bg-slate-100'
    },
    {
      title: 'Inventory Valuation',
      value: `$${stats.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'At standard cost price',
      icon: DollarSign,
      href: '/inventory',
      badge: 'Assets',
      badgeColor: 'text-emerald-700 bg-emerald-50'
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      subtitle: `${stats.outOfStockCount} out of stock items`,
      icon: AlertTriangle,
      href: '/inventory?status=LOW_STOCK',
      badge: stats.lowStockCount > 0 ? 'Requires Reorder' : 'Healthy',
      badgeColor: stats.lowStockCount > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
    },
    {
      title: 'Warehouse Occupancy',
      value: `${stats.occupancyRate}%`,
      subtitle: `${stats.occupiedLocationsCount} / ${stats.totalLocationsCount} storage bins`,
      icon: Layers,
      href: '/locations',
      badge: `${stats.totalLocationsCount - stats.occupiedLocationsCount} bins free`,
      badgeColor: 'text-blue-700 bg-blue-50'
    },
    {
      title: 'Pending Inbound',
      value: stats.pendingInboundCount,
      subtitle: 'Expected & receiving POs',
      icon: ArrowDownToLine,
      href: '/inbound',
      badge: 'Dock Inbound',
      badgeColor: 'text-indigo-700 bg-indigo-50'
    },
    {
      title: 'Outbound In-Flight',
      value: stats.pendingOutboundCount,
      subtitle: 'Picking & packed orders',
      icon: ArrowUpFromLine,
      href: '/outbound',
      badge: 'Fulfillment',
      badgeColor: 'text-purple-700 bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Link
            key={idx}
            href={card.href}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 line-clamp-1">{card.title}</span>
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{card.subtitle}</div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
