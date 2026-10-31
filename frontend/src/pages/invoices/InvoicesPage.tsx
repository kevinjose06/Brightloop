import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Invoice, InvoiceStatus, Customer } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { Search, Filter, Printer, ArrowRight, AlertTriangle, Receipt, CreditCard, Clock, CheckCircle2 } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (customerFilter) params.append('customerId', customerFilter);
      if (searchTerm) params.append('q', searchTerm);

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/catalog/customers');
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, customerFilter, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === 'CONFIRMED' && inv.total - inv.amountPaid > 0 && new Date(inv.dueDate) < new Date()
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Context Banner matching Stitch AI */}
      <div className="relative w-full rounded-xl bg-white p-6 shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">
                Invoices & Statements
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {invoices.length} Generated Invoices
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Audit recurring cycles, track outstanding balances, confirm proposals, and record customer payments across all corporate accounts.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Strip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Billed</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#3730A3] flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">
              {formatCurrency(totalBilled)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collected Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">
              {formatCurrency(totalPaid)}
            </span>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
              Paid
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outstanding Balance</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-amber-700 tracking-tight">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overdue Invoices</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-rose-700 tracking-tight">
              {overdueInvoices.length}
            </span>
            <span className="text-xs text-rose-600 font-medium">Action Required</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E] focus:outline-none focus:ring-1 focus:ring-[#3730A3]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E] focus:ring-1 focus:ring-[#3730A3]"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="h-9 px-3 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E] focus:ring-1 focus:ring-[#3730A3]"
        >
          <option value="">All Customer Accounts</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] uppercase text-[11px] font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Subscription</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Total</th>
                <th className="px-6 py-3.5 text-right">Balance Due</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No invoices found matching the selected filters.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const balanceDue = Math.max(0, inv.total - inv.amountPaid);
                  const isOverdue =
                    inv.status === 'CONFIRMED' &&
                    balanceDue > 0 &&
                    new Date(inv.dueDate) < new Date();

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-[#3730A3]">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="hover:underline"
                          >
                            {inv.number}
                          </Link>
                          {isOverdue && (
                            <span title="Past Due Date" className="text-rose-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {inv.customer?.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <Link
                          to={`/subscriptions/${inv.subscriptionId}`}
                          className="text-[#3730A3] hover:underline"
                        >
                          {inv.subscription?.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className={isOverdue ? 'text-rose-700 font-semibold' : ''}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(inv.total)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          balanceDue > 0 ? (isOverdue ? 'text-rose-700' : 'text-amber-700') : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(balanceDue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/v1/invoices/${inv.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </a>
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#3730A3] hover:underline"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
