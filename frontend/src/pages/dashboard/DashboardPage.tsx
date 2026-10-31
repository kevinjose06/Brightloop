import React, { useState, useEffect } from 'react';
import { api, formatCurrency } from '../../lib/api.js';
import { FinanceSummary, Plan, Customer } from '../../types/index.js';
import { StatsCard } from '../../components/common/StatsCard.js';
import {
  Users,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  Filter,
  RefreshCw,
  ExternalLink,
  Plus,
  Calendar,
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
  const [isLoading, setIsLoading] = useState(true);
  const [periodTab, setPeriodTab] = useState<'30d' | 'qtd' | 'ytd' | 'custom'>('30d');

  const fetchDashboardData = async () => {
    setIsLoading(true);
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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header matching Stitch AI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#131B2E]">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of recurring revenue, active subscription health, and collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg text-slate-500 hover:text-[#3730A3] bg-white border border-[#E2E8F0] shadow-sm hover:bg-slate-50 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/subscriptions"
            className="h-9 px-4 rounded-lg bg-[#3730A3] hover:bg-[#312E81] text-white text-xs font-medium shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subscription</span>
          </Link>
        </div>
      </div>

      {/* Period Selection & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setPeriodTab('30d')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periodTab === '30d'
                ? 'bg-white text-[#131B2E] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-[#131B2E]'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriodTab('qtd')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periodTab === 'qtd'
                ? 'bg-white text-[#131B2E] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-[#131B2E]'
            }`}
          >
            Quarter to Date
          </button>
          <button
            onClick={() => setPeriodTab('ytd')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periodTab === 'ytd'
                ? 'bg-white text-[#131B2E] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-[#131B2E]'
            }`}
          >
            Year to Date
          </button>
          <button
            onClick={() => setPeriodTab('custom')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              periodTab === 'custom'
                ? 'bg-white text-[#131B2E] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-[#131B2E]'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] shadow-sm text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Active Period • FY 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
        </div>
      </div>

      {/* Granular Filters Dropdown Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-[#3730A3]" />
          <span>Filter Dataset:</span>
        </div>

        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="px-2.5 py-1.5 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#3730A3] text-xs text-[#131B2E]"
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
          className="px-2.5 py-1.5 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#3730A3] text-xs text-[#131B2E]"
        >
          <option value="">All Customer Accounts</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <span>From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E]"
          />
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <span>To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E]"
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
            className="text-[#3730A3] hover:underline font-semibold text-[11px] ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4 Metric Cards matching Stitch AI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(summary?.mrr ?? 0)}
          icon={TrendingUp}
          trend="+12.4%"
          trendUp={true}
          subtitle="vs last month"
        />

        <StatsCard
          title="Annual Run Rate (ARR)"
          value={formatCurrency((summary?.mrr ?? 0) * 12)}
          icon={CreditCard}
          trend="+14.2%"
          trendUp={true}
          subtitle="projected trajectory"
        />

        <StatsCard
          title="Active Subscriptions"
          value={summary?.activeSubscriptions ?? 0}
          icon={Users}
          trend="+6.1%"
          trendUp={true}
          subtitle="healthy contracts"
        />

        <StatsCard
          title="Revenue Collected"
          value={formatCurrency(summary?.revenueCollected ?? 0)}
          icon={Receipt}
          badge="Net Verified"
          subtitle="paid statements"
        />
      </div>

      {/* Charts & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Cohort Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-[#E2E8F0]">
              <div>
                <h2 className="font-semibold text-sm text-[#131B2E]">
                  MRR Velocity & Net Expansion Trajectory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly recurring revenue bridge tracking collections vs invoiced
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3730A3]"></span>
                  <span>Collected</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]"></span>
                  <span>Invoiced Total</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-8 h-48 flex items-end gap-4 sm:gap-6 justify-between px-2 pb-2 border-b border-slate-100">
              {series.map((item) => {
                const maxVal = Math.max(...series.map((s) => Math.max(s.revenue, s.billed)), 1);
                const revHeight = Math.max(12, Math.round((item.revenue / maxVal) * 150));
                const billHeight = Math.max(12, Math.round((item.billed / maxVal) * 150));

                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-40">
                      <div
                        style={{ height: `${revHeight}px` }}
                        className="w-4 sm:w-6 bg-[#3730A3] rounded-t-sm transition-all group-hover:opacity-90 relative"
                        title={`Revenue Collected: ${formatCurrency(item.revenue)}`}
                      ></div>
                      <div
                        style={{ height: `${billHeight}px` }}
                        className="w-4 sm:w-6 bg-[#0F766E] rounded-t-sm transition-all group-hover:opacity-90 relative"
                        title={`Total Invoiced: ${formatCurrency(item.billed)}`}
                      ></div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase">
                      {item.month}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              Retention and collection trajectory running positive across rolling cycles
            </span>
            <Link to="/invoices" className="text-[#3730A3] hover:underline font-medium">
              View Detailed Ledgers →
            </Link>
          </div>
        </div>

        {/* Overdue Accounts & Collection Queue */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm text-[#131B2E]">Attention Needed</h2>
                  {overdueInvoices.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-200">
                      {overdueInvoices.length} Past Due
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Uncollected receivables requiring follow-up</p>
              </div>

              <Link
                to="/invoices"
                className="text-xs font-semibold text-[#3730A3] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5 mt-4 max-h-72 overflow-y-auto pr-1">
              {overdueInvoices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="font-medium text-slate-600">Zero Overdue Receivables</p>
                  <p className="text-[11px] mt-1">All accounts are currently in good standing.</p>
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
                          className="font-semibold text-xs text-[#131B2E] hover:text-[#3730A3]"
                        >
                          {inv.number}
                        </Link>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          {inv.daysOverdue}d late
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate max-w-[150px]">
                        {inv.customer?.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-rose-800">
                        {formatCurrency(inv.balance)}
                      </p>
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="text-[11px] font-medium text-[#3730A3] hover:underline inline-block mt-0.5"
                      >
                        Remind →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding Balance:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(summary?.outstandingTotal ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
