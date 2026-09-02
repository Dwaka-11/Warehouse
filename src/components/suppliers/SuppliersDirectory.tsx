'use client';

import React, { useState } from 'react';
import { Supplier, Customer } from '@/lib/types';
import { Truck, Users, Plus, Search, Building2, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { createSupplierAction, createCustomerAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface SuppliersDirectoryProps {
  initialSuppliers: Supplier[];
  initialCustomers: Customer[];
}

export function SuppliersDirectory({ initialSuppliers, initialCustomers }: SuppliersDirectoryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'CUSTOMERS'>('SUPPLIERS');
  const [search, setSearch] = useState('');
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const filteredSuppliers = initialSuppliers.filter(s =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = initialCustomers.filter(c =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'SUPPLIERS' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Suppliers ({initialSuppliers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'CUSTOMERS' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers ({initialCustomers.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by name, contact, or code...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* Action Button */}
        {activeTab === 'SUPPLIERS' ? (
          <button
            onClick={() => setAddSupplierOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Add Supplier Partner</span>
          </button>
        ) : (
          <button
            onClick={() => setAddCustomerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Add Customer Account</span>
          </button>
        )}
      </div>

      {/* Directory Tables */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {activeTab === 'SUPPLIERS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-4">Supplier Entity</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Active POs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{s.contact_name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{s.address}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{s.email}</div>
                      <div className="text-[11px] text-slate-400">{s.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 font-mono">{s.lead_time_days} days</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded text-[11px]">
                        {s.payment_terms}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">
                        {s.active_pos_count || 0} POs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Contact Representative</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Shipping Address</th>
                  <th className="py-3 px-4 text-right">Total Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{c.contact_name}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 line-clamp-1">{c.shipping_address}</div>
                      <div className="text-[11px] text-slate-400">{c.city}, {c.country}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">
                        {c.total_orders_count || 0} orders
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSupplierModal
        isOpen={addSupplierOpen}
        onClose={() => setAddSupplierOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <AddCustomerModal
        isOpen={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function AddSupplierModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [leadTime, setLeadTime] = useState('7');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const random = Math.floor(100 + Math.random() * 900);
      setCode(`SUP-${random}`);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createSupplierAction({
        name,
        code,
        contact_name: contact,
        email,
        phone,
        address,
        lead_time_days: parseInt(leadTime, 10) || 7,
        payment_terms: paymentTerms
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Supplier Vendor Partner"
      subtitle="Register procurement source details"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Vendor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
            <input
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? 'Creating...' : 'Register Supplier'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddCustomerModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const random = Math.floor(100 + Math.random() * 900);
      setCode(`CUST-${random}`);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createCustomerAction({
        name,
        code,
        contact_name: contact,
        email,
        phone,
        shipping_address: address,
        city,
        country
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Customer Account"
      subtitle="Register dispatch and shipping destination"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Company</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? 'Registering...' : 'Register Customer'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
