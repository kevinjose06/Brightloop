import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Subscription, SubscriptionStatus, Invoice } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Building,
} from 'lucide-react';

export const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/subscriptions/${id}`);
      setSubscription(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const handleTransition = async (targetStatus: SubscriptionStatus) => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/subscriptions/${id}/transition`, { to: targetStatus });
      setSubscription(res.data.data);
      setSuccessMsg(`Subscription status successfully updated to ${targetStatus}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid transition');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePause = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/subscriptions/${id}/${subscription?.isPaused ? 'resume' : 'pause'}`);
      setSubscription(res.data.data);
      setSuccessMsg(`Subscription ${subscription?.isPaused ? 'resumed' : 'paused'}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to toggle pause');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/subscriptions/${id}/renew`);
      setSubscription(res.data.data);
      setSuccessMsg('Subscription renewed and expiry extended');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Renewal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunBillingNow = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post('/billing/run', { subscriptionId: id });
      setSuccessMsg(`Billing engine evaluated: ${res.data.data.created} invoice(s) generated!`);
      fetchSubscription();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Billing run failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading subscription records...</div>;
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 text-sm mb-4">Subscription record not found.</p>
        <Link to="/subscriptions" className="text-indigo-600 text-xs font-semibold">
          ← Back to subscriptions
        </Link>
      </div>
    );
  }

  const steps: SubscriptionStatus[] = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];
  const currentStepIdx = steps.indexOf(subscription.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Header */}
      <div>
        <Link
          to="/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subscriptions</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {subscription.number}
              </h1>
              <StatusBadge status={subscription.status} />
              {subscription.isPaused && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <PauseCircle className="w-3.5 h-3.5" /> Paused
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customer: <span className="font-semibold text-slate-800">{subscription.customer?.name}</span> ({subscription.customer?.company || 'Direct'})
            </p>
          </div>

          {/* Contextual Lifecycle Action Buttons (PRD §7) */}
          <div className="flex flex-wrap items-center gap-2">
            {subscription.status === 'DRAFT' && (
              <button
                disabled={isProcessing}
                onClick={() => handleTransition('QUOTATION')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Send Quotation
              </button>
            )}

            {subscription.status === 'QUOTATION' && (
              <button
                disabled={isProcessing}
                onClick={() => handleTransition('CONFIRMED')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Subscription
              </button>
            )}

            {subscription.status === 'CONFIRMED' && (
              <button
                disabled={isProcessing}
                onClick={() => handleTransition('ACTIVE')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Activate Subscription
              </button>
            )}

            {subscription.status === 'ACTIVE' && (
              <>
                {subscription.plan.allowPause && (
                  <button
                    disabled={isProcessing}
                    onClick={handleTogglePause}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    {subscription.isPaused ? 'Resume Billing' : 'Pause Subscription'}
                  </button>
                )}

                {subscription.plan.allowRenew && (
                  <button
                    disabled={isProcessing}
                    onClick={handleRenew}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Extend / Renew
                  </button>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleRunBillingNow}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  title="Generate invoice immediately for this subscription"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Bill Subscription Now</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handleTransition('CLOSED')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg"
                >
                  Close Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status Stepper (PRD §7, §10.2 #8) */}
      <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-soft">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Lifecycle State Machine
        </p>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isCurrent
                      ? 'text-indigo-600 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Grid & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
            <Building className="w-4 h-4" />
            <span>Customer Profile</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{subscription.customer?.name}</p>
            <p className="text-xs text-slate-500">{subscription.customer?.email}</p>
            {subscription.customer?.phone && (
              <p className="text-xs text-slate-500">{subscription.customer?.phone}</p>
            )}
            {subscription.customer?.taxId && (
              <p className="text-xs text-slate-500 mt-1">Tax ID: {subscription.customer?.taxId}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            <span>Plan Cadence</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{subscription.plan?.name}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(subscription.plan?.price)} per {subscription.plan?.billingPeriod}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Terms: <span className="font-semibold">{subscription.paymentTerms}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
            <Calendar className="w-4 h-4" />
            <span>Billing Timeline</span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Start Date:</span>
              <span className="font-semibold text-slate-800">{formatDate(subscription.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Billing:</span>
              <span className="font-semibold text-indigo-600">{formatDate(subscription.nextInvoiceDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Expiry:</span>
              <span className="font-semibold text-slate-800">{formatDate(subscription.expiryDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Line Items (Effective Pricing PRD §8.1) */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">Configured Line Items & Variant Pricing</h3>
          <p className="text-xs text-slate-500">Effective unit prices snapshot at creation</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-3">Product Description</th>
              <th className="px-6 py-3">Selected Variant</th>
              <th className="px-6 py-3 text-center">Quantity</th>
              <th className="px-6 py-3 text-right">Effective Unit Price</th>
              <th className="px-6 py-3 text-right">Recurring Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscription.lines?.map((line) => (
              <tr key={line.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-semibold text-slate-900">{line.product?.name}</td>
                <td className="px-6 py-4">
                  {line.variant ? (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-100">
                      {line.variant.attribute}: {line.variant.value} (+{formatCurrency(line.variant.extraPrice)})
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">None</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center font-medium">{line.quantity}</td>
                <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(line.unitPrice)}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/60 font-semibold border-t border-slate-200">
            <tr>
              <td colSpan={4} className="px-6 py-3 text-right text-slate-600">
                Total Recurring Period Amount:
              </td>
              <td className="px-6 py-3 text-right font-extrabold text-indigo-600 text-sm">
                {formatCurrency(subscription.lines?.reduce((sum, l) => sum + l.amount, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Generated Invoices Tab */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Generated Invoices</h3>
            <p className="text-xs text-slate-500">History of billing cycles created for this contract</p>
          </div>
        </div>

        {subscription.invoices && subscription.invoices.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscription.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <Link to={`/invoices/${inv.id}`} className="text-indigo-600 hover:underline">
                      {inv.number}
                    </Link>
                  </td>
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
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No invoices have been billed for this subscription yet.
          </div>
        )}
      </div>
    </div>
  );
};

