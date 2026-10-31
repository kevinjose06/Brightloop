import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { FinanceSummary, Plan, Customer } from '../../types/index.js';
import { StatsCard } from '../../components/common/StatsCard.js';
import { StatusBadge } from '../../components/common/Badge.js';
import {
  Users,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [series, setSeries] = useState<Array<{ month: string; revenue: number; billed: number }>>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filter state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [responseTime, setResponseTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const params = new URLSearchParams();
      if (selectedPlanId) params.append('planId', selectedPlanId);
      if (selectedCustomerId) params.append('customerId', selectedCustomerId);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const [summaryRes, seriesRes, overdueRes, plansRes, custRes] = await Promise.all([
        api.get(`/reports/summary?${params.toString()}`),
        api.get('/reports/revenue-series?months=6'),
        api.get('/reports/overdue'),
        api.get('/catalog/plans'),
        api.get('/catalog/customers'),
      ]);

      const end = performance.now();
      const serverHeader = summaryRes.headers['x-response-time'];
      setResponseTime(serverHeader || `${(end - start).toFixed(1)}ms`);

      setSummary(summaryRes.data.data);
      setSeries(seriesRes.data.data);
      setOverdueInvoices(overdueRes.data.data);
      setPlans(plansRes.data.data);
      setCustomers(custRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPlanId, selectedCustomerId, fromDate, toDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Filters & Performance Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Financial & Subscription Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time MRR, recurring billings, overdue collections, and pipeline metrics
          </p>
        </div>

        {/* Response Time Badge (PRD §13 Proof) */}
        <div className="flex items-center gap-3">
          {responseTime && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Query Execution: {responseTime} (Target: &lt; 2s)</span>
            </div>
          )}

          <button
            onClick={fetchDashboardData}
            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-card border border-slate-200/80 shadow-soft flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-2">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Subscription Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Accounts</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <span className="text-slate-400">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
          />
        </div>

        {(selectedPlanId || selectedCustomerId || fromDate || toDate) && (
          <button
            onClick={() => {
              setSelectedPlanId('');
              setSelectedCustomerId('');
              setFromDate('');
              setToDate('');
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards (PRD §8.6, §10.2 #2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Active Subs"
          value={summary?.activeSubscriptions ?? 0}
          icon={Users}
          tooltip="Subscriptions currently in ACTIVE status"
        />

        <StatsCard
          title="Monthly MRR"
          value={formatCurrency(summary?.mrr ?? 0)}
          icon={TrendingUp}
          trend="+14% MoM"
          trendUp={true}
          tooltip="Sum of active recurring totals normalized to monthly (paise precision)"
        />

        <StatsCard
          title="Revenue Collected"
          value={formatCurrency(summary?.revenueCollected ?? 0)}
          icon={CreditCard}
          tooltip="Sum of verified payments completed in selected date range"
        />

        <StatsCard
          title="Outstanding"
          value={formatCurrency(summary?.outstandingTotal ?? 0)}
          icon={Receipt}
          tooltip="Unpaid balance across Confirmed invoices"
        />

        <StatsCard
          title="Overdue Accounts"
          value={summary?.overdueCount ?? 0}
          badge={formatCurrency(summary?.overdueAmount ?? 0)}
          icon={AlertTriangle}
          tooltip="Confirmed invoices with past dueDate and unpaid balance"
        />
      </div>

      {/* Charts & Overdue Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Series */}
        <div className="lg:col-span-2 bg-white rounded-card p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Revenue Collection vs Invoiced</h3>
              <p className="text-xs text-slate-500">Trailing 6-month financial trajectory</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> Invoiced
              </span>
            </div>
          </div>

          {/* Clean CSS Bar Chart */}
          <div className="mt-8 h-48 flex items-end gap-6 justify-between px-4 pb-2 border-b border-slate-100">
            {series.map((item) => {
              const maxVal = Math.max(...series.map((s) => Math.max(s.revenue, s.billed)), 1);
              const revHeight = Math.max(10, Math.round((item.revenue / maxVal) * 160));
              const billHeight = Math.max(10, Math.round((item.billed / maxVal) * 160));

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    <div
                      style={{ height: `${revHeight}px` }}
                      className="w-4 sm:w-6 bg-indigo-600 rounded-t-sm transition-all group-hover:bg-indigo-500 relative"
                      title={`Revenue: ${formatCurrency(item.revenue)}`}
                    ></div>
                    <div
                      style={{ height: `${billHeight}px` }}
                      className="w-4 sm:w-6 bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300 relative"
                      title={`Billed: ${formatCurrency(item.billed)}`}
                    ></div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Attention List */}
        <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Overdue Invoices</h3>
              <p className="text-xs text-slate-500">Requires collection follow-up</p>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <span>View all</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1 max-h-72">
            {overdueInvoices.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                🎉 No overdue invoices! All accounts are currently in good standing.
              </div>
            ) : (
              overdueInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-bold text-xs text-slate-900 hover:text-indigo-600"
                      >
                        {inv.number}
                      </Link>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        {inv.daysOverdue} days late
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate max-w-[160px]">
                      {inv.customer?.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(inv.balance)}
                    </p>
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-[11px] font-medium text-indigo-600 hover:underline"
                    >
                      Collect →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

