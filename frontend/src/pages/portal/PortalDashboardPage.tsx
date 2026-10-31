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
      {/* Customer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Customer Self-Service Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Account: <span className="font-semibold text-slate-800">{user?.name || user?.email}</span> ({user?.email})
          </p>
        </div>
      </div>

      {queryError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{queryError}</span>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <Repeat className="w-4 h-4" />
            <h2 className="font-semibold text-slate-900 text-sm">My Active & Past Subscriptions</h2>
          </div>
          <span className="text-xs text-slate-500">{subscriptions.length} Contract(s)</span>
        </div>

        {subsLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
            <span>Loading subscriptions...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No active subscriptions found for this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3">Contract #</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Next Billing</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3 text-right">Self-Service Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{sub.number}</td>
                    <td className="px-6 py-4 text-slate-800">
                      <span className="font-medium">{sub.plan?.name}</span>{' '}
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <Receipt className="w-4 h-4" />
            <h2 className="font-semibold text-slate-900 text-sm">My Invoices & Statements</h2>
          </div>
          <span className="text-xs text-slate-500">{invoices.length} Invoice(s)</span>
        </div>

        {invsLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
            <span>Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No invoices generated yet for this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Billing Period</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const balance = Math.max(0, inv.total - inv.amountPaid);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{inv.number}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {formatPaise(inv.total)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatPaise(balance)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/v1/invoices/${inv.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 rounded px-1.5 py-0.5"
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
