import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Subscription, Invoice } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Repeat,
  Receipt,
  Printer,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const PortalDashboardPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      const [subsRes, invRes] = await Promise.all([
        api.get('/portal/subscriptions'),
        api.get('/portal/invoices'),
      ]);
      setSubscriptions(subsRes.data.items);
      setInvoices(invRes.data.items);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load customer portal data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handlePauseToggle = async (sub: Subscription) => {
    setError(null);
    setSuccess(null);
    try {
      const action = sub.isPaused ? 'resume' : 'pause';
      await api.post(`/portal/subscriptions/${sub.id}/${action}`);
      setSuccess(`Subscription successfully ${sub.isPaused ? 'resumed' : 'paused'}`);
      fetchPortalData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleCloseEarly = async (sub: Subscription) => {
    if (!window.confirm('Are you sure you want to cancel this subscription early?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/portal/subscriptions/${sub.id}/close`);
      setSuccess('Subscription has been closed');
      fetchPortalData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to close subscription');
    }
  };

  const handleRenew = async (sub: Subscription) => {
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/portal/subscriptions/${sub.id}/renew`);
      setSuccess('Subscription renewed and contract period extended!');
      fetchPortalData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Renewal failed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Customer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Customer Self-Service Portal
          </h1>
          <p className="text-xs text-slate-500">
            Account: <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Repeat className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-sm">My Active & Past Subscriptions</h3>
          </div>
          <span className="text-xs text-slate-500">{subscriptions.length} Contract(s)</span>
        </div>

        <table className="w-full text-left text-xs">
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
              <tr key={sub.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-900">{sub.number}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">
                  {sub.plan?.name} ({formatCurrency(sub.plan?.price)} / {sub.plan?.billingPeriod})
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={sub.status} />
                    {sub.isPaused && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Paused
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {formatDate(sub.nextInvoiceDate)}
                </td>
                <td className="px-6 py-4 text-slate-500">{formatDate(sub.expiryDate)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {sub.status === 'ACTIVE' && sub.plan.allowPause && (
                      <button
                        onClick={() => handlePauseToggle(sub)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                        title={sub.isPaused ? 'Resume billing' : 'Pause subscription'}
                      >
                        {sub.isPaused ? 'Resume' : 'Pause'}
                      </button>
                    )}

                    {sub.status === 'ACTIVE' && sub.plan.allowRenew && (
                      <button
                        onClick={() => handleRenew(sub)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                      >
                        Renew
                      </button>
                    )}

                    {sub.status === 'ACTIVE' && sub.plan.allowEarlyClose && (
                      <button
                        onClick={() => handleCloseEarly(sub)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Receipt className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-sm">My Invoices & Statements</h3>
          </div>
          <span className="text-xs text-slate-500">{invoices.length} Invoice(s)</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Billing Period</th>
              <th className="px-6 py-3">Due Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Balance Due</th>
              <th className="px-6 py-3 text-right">Print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const balance = Math.max(0, inv.total - inv.amountPaid);
              return (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{inv.number}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(inv.total)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-bold ${
                      balance > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(balance)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/api/v1/invoices/${inv.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
