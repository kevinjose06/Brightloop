import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Invoice, InvoiceStatus, Customer } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { Search, Filter, Printer, ArrowRight, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Invoices & Billing Statements
          </h1>
          <p className="text-xs text-slate-500">
            Audit recurring cycles, track outstanding balances, confirm proposals, and record customer payments
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-card border border-slate-200/80 shadow-soft flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by INV-# or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
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
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
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
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Subscription</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Balance Due</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const balanceDue = Math.max(0, inv.total - inv.amountPaid);
                const isOverdue =
                  inv.status === 'CONFIRMED' &&
                  balanceDue > 0 &&
                  new Date(inv.dueDate) < new Date();

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isOverdue ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
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
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {inv.customer?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <Link
                        to={`/subscriptions/${inv.subscriptionId}`}
                        className="text-slate-600 hover:text-indigo-600"
                      >
                        {inv.subscription?.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        balanceDue > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'
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
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

