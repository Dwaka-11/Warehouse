'use client';

import React, { useState } from 'react';
import { Search, ScanLine, Bell, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { QuickSearchModal } from './QuickSearchModal';
import Link from 'next/link';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 no-print sticky top-0 z-30">
        {/* Search trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100/70 hover:text-slate-600 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              <span>Search inventory, orders, bins, or scan barcode...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white rounded border border-slate-200 shadow-2xs font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right action utilities */}
        <div className="flex items-center gap-3">
          <Link
            href="/scanner"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Open Barcode & QR Scanner"
          >
            <ScanLine className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Scan Code</span>
          </Link>

          <Link
            href="/inbound"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">New Inbound PO</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* User profile avatar */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              WL
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-none">Warehouse Lead</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Shift Supervisor</div>
            </div>
          </div>
        </div>
      </header>

      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
