'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  MapPin,
  ArrowDownToLine,
  ArrowUpFromLine,
  ScanLine,
  Truck,
  History,
  Warehouse,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { resetDatabaseAction } from '@/lib/actions';

export function Sidebar() {
  const pathname = usePathname();
  const [resetting, setResetting] = React.useState(false);

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Inventory (SKUs)', href: '/inventory', icon: Boxes },
    { label: 'Warehouse Map', href: '/locations', icon: MapPin },
    { label: 'Inbound (Receiving)', href: '/inbound', icon: ArrowDownToLine },
    { label: 'Outbound (Shipping)', href: '/outbound', icon: ArrowUpFromLine },
    { label: 'Barcode Scanner', href: '/scanner', icon: ScanLine },
    { label: 'Partners & Directory', href: '/suppliers', icon: Truck },
    { label: 'Audit Movement Log', href: '/movements', icon: History },
  ];

  const handleResetData = async () => {
    if (window.confirm('Reset warehouse database to sample demonstration data?')) {
      setResetting(true);
      await resetDatabaseAction();
      setResetting(false);
      window.location.reload();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen no-print select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Warehouse className="w-5 h-5 text-slate-100" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight">OmniFlow WMS</h1>
          <p className="text-[11px] font-medium text-slate-500">Facility WH-CHI-01</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Warehouse Operations
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Warehouse Status & Quick Reset */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Core Engine Active</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">v2.4.0</span>
        </div>

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          title="Reload initial demo warehouse inventory, orders, and locations"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting Data...' : 'Reset Demo Data'}</span>
        </button>
      </div>
    </aside>
  );
}
