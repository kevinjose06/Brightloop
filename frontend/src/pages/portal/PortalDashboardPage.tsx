import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { formatPaise } from '../../lib/money.js';
import { formatDate } from '../../lib/date.js';
import { Subscription, Invoice } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { SubscriptionActions } from '../../components/subscriptions/SubscriptionActions.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Repeat,
  Receipt,
  Printer,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export const PortalDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const {
    data: subsData,
    isLoading: subsLoading,
    error: subsError,
  } = useQuery({
    queryKey: ['portal', 'subscriptions'],
    queryFn: async () => {
      const res = await api.get('/portal/subscriptions');
      return res.data;
    },
  });

  const {
    data: invsData,
    isLoading: invsLoading,
    error: invsError,
  } = useQuery({
    queryKey: ['portal', 'invoices'],
    queryFn: async () => {
      const res = await api.get('/portal/invoices');
      return res.data;
    },
  });

  const subscriptions: Subscription[] = subsData?.items || [];
  const invoices: Invoice[] = invsData?.items || [];
  const queryError =
    (subsError as any)?.response?.data?.error?.message ||
    (subsError as any)?.response?.data?.message ||
    (invsError as any)?.response?.data?.error?.message ||
    (invsError as any)?.response?.data?.message;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Stitch Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
              Client Portal
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-secondary">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Self-Service Active</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Customer Self-Service Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Account: <span className="font-semibold text-slate-800">{user?.name || user?.email}</span> ({user?.email})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#FAF8FF] border border-primary/20 rounded-lg px-3.5 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Active Contracts</span>
            <span className="text-lg font-bold text-primary font-mono">{subscriptions.length}</span>
          </div>
          <div className="bg-[#F0FDF4] border border-emerald-200 rounded-lg px-3.5 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Total Invoices</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{invoices.length}</span>
          </div>
        </div>
      </div>

      {queryError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{queryError}</span>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Repeat className="w-4 h-4" />
            <h2 className="font-bold text-slate-900 text-sm">My Active & Past Subscriptions</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">{subscriptions.length} Contract(s)</span>
        </div>

        {subsLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading subscriptions...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No active subscriptions found for this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Contract #</th>
                  <th className="px-6 py-3.5">Plan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Next Billing</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5 text-right">Self-Service Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono">{sub.number}</td>
                    <td className="px-6 py-4 text-slate-800">
                      <span className="font-medium text-slate-900">{sub.plan?.name}</span>{' '}
                      <span className="text-slate-500">
                        ({formatPaise(sub.plan?.price)} / {sub.plan?.billingPeriod?.toLowerCase()})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} isPaused={sub.isPaused} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {formatDate(sub.nextInvoiceDate)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(sub.expiryDate)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <SubscriptionActions subscription={sub} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Receipt className="w-4 h-4" />
            <h2 className="font-bold text-slate-900 text-sm">My Invoices & Statements</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">{invoices.length} Invoice(s)</span>
        </div>

        {invsLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No invoices generated yet for this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Billing Period</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const balance = Math.max(0, inv.total - inv.amountPaid);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 font-mono">{inv.number}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900 font-mono">
                        {formatPaise(inv.total)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold font-mono ${
                          balance > 0 ? 'text-amber-700' : 'text-secondary'
                        }`}
                      >
                        {formatPaise(balance)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/v1/invoices/${inv.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 bg-primary/5 hover:bg-primary/10 transition-colors"
                          title="View & Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
