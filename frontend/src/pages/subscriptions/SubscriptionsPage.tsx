import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Subscription, Customer, Plan, QuotationTemplate, Product, SubscriptionStatus, PaymentTerms } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Plus,
  Repeat,
  Search,
  Filter,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('IMMEDIATE');
  const [lineItems, setLineItems] = useState<Array<{ productId: string; variantId: string; quantity: number }>>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('planId', planFilter);
      if (searchTerm) params.append('q', searchTerm);

      const res = await api.get(`/subscriptions?${params.toString()}`);
      setSubscriptions(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, plansRes, tplRes, prodRes] = await Promise.all([
        api.get('/catalog/customers'),
        api.get('/catalog/plans'),
        api.get('/catalog/quotation-templates'),
        api.get('/catalog/products'),
      ]);
      setCustomers(custRes.data.data);
      setPlans(plansRes.data.data);
      setTemplates(tplRes.data.data);
      setProducts(prodRes.data.data);

      if (custRes.data.data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custRes.data.data[0].id);
      }
      if (plansRes.data.data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansRes.data.data[0].id);
      }
      if (prodRes.data.data.length > 0 && lineItems.length === 0) {
        setLineItems([{ productId: prodRes.data.data[0].id, variantId: '', quantity: 1 }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, planFilter, searchTerm]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    setError(null);
    if (products.length > 0 && lineItems.length === 0) {
      setLineItems([{ productId: products[0].id, variantId: '', quantity: 1 }]);
    }
    setIsModalOpen(true);
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const validLines = lineItems
        .filter((l) => Boolean(l.productId))
        .map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: Number(l.quantity) || 1,
        }));

      if (!selectedTemplateId && validLines.length === 0) {
        if (products.length > 0) {
          validLines.push({
            productId: products[0].id,
            variantId: undefined,
            quantity: 1,
          });
        }
      }

      const payload: any = {
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        startDate: new Date(startDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        paymentTerms,
        templateId: selectedTemplateId || undefined,
        lines: validLines.length > 0 ? validLines : undefined,
      };

      await api.post('/subscriptions', payload);
      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initialize subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const draftCount = subscriptions.filter((s) => s.status === 'DRAFT' || s.status === 'QUOTATION').length;
  const closedCount = subscriptions.filter((s) => s.status === 'CLOSED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Visual Header & Context Banner from Stitch AI */}
      <div className="relative w-full rounded-xl bg-white p-6 shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">
                Subscriptions
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {subscriptions.length} Registered Contracts
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Manage recurring customer accounts, plan transitions, automated prorations, and renewal lifecycle statuses across international clusters.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="h-9 px-4 rounded-lg bg-[#3730A3] hover:bg-[#312E81] text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Strip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Subscriptions</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#3730A3] flex items-center justify-center">
              <Repeat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">{subscriptions.length}</span>
            <span className="inline-flex items-center gap-0.5 text-xs text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" /> +4.2% MoM
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active State</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Recurring Active
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">{activeCount}</span>
            <span className="text-xs text-slate-500">
              {subscriptions.length > 0 ? Math.round((activeCount / subscriptions.length) * 100) : 0}% healthy
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Quotation / Draft</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-[#3730A3] border border-indigo-200">
              Pipeline POC
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">{draftCount}</span>
            <span className="text-xs text-indigo-700 font-medium">Pending Activation</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Closed / Completed</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              Lifecycle Ended
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#131B2E] tracking-tight">{closedCount}</span>
            <span className="text-xs text-slate-400">Archived contracts</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by subscription #, customer, or plan..."
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
          <option value="">Status: All</option>
          <option value="DRAFT">DRAFT</option>
          <option value="QUOTATION">QUOTATION</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-9 px-3 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E] focus:ring-1 focus:ring-[#3730A3]"
        >
          <option value="">All Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subscriptions Table matching Stitch AI */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] uppercase text-[11px] font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Subscription #</th>
                <th className="px-6 py-3.5">Customer & Contact</th>
                <th className="px-6 py-3.5">Plan Commitment</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Next Billing</th>
                <th className="px-6 py-3.5">Expiry Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No subscriptions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const custInitials = sub.customer?.name
                    ? sub.customer.name.slice(0, 2).toUpperCase()
                    : 'CU';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-[#3730A3]">
                        <Link
                          to={`/subscriptions/${sub.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {sub.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 text-[#3730A3] font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {custInitials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{sub.customer?.name}</p>
                            <p className="text-[11px] text-slate-500">{sub.customer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{sub.plan?.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(sub.plan?.price)} / {sub.plan?.billingPeriod?.toLowerCase()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} isPaused={sub.isPaused} />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatDate(sub.nextInvoiceDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(sub.expiryDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/subscriptions/${sub.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#3730A3] hover:text-indigo-800"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initialize Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Subscription"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Account *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan *</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price)} / {p.billingPeriod})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Template (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Start Blank</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedTemplateId && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Subscription Products *</span>
                <button
                  type="button"
                  onClick={() => {
                    if (products.length > 0) {
                      setLineItems([...lineItems, { productId: products[0].id, variantId: '', quantity: 1 }]);
                    }
                  }}
                  className="text-[11px] font-semibold text-[#3730A3] hover:underline"
                >
                  + Add Product
                </button>
              </div>

              {lineItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const newLines = [...lineItems];
                        newLines[idx].productId = e.target.value;
                        newLines[idx].variantId = '';
                        setLineItems(newLines);
                      }}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.salesPrice)})
                        </option>
                      ))}
                    </select>

                    {prod && prod.variants && prod.variants.length > 0 && (
                      <select
                        value={item.variantId}
                        onChange={(e) => {
                          const newLines = [...lineItems];
                          newLines[idx].variantId = e.target.value;
                          setLineItems(newLines);
                        }}
                        className="w-36 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      >
                        <option value="">Standard Variant</option>
                        {prod.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.attribute}: {v.value} (+{formatCurrency(v.extraPrice)})
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newLines = [...lineItems];
                        newLines[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setLineItems(newLines);
                      }}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-center"
                      title="Quantity"
                    />

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newLines = lineItems.filter((_, i) => i !== idx);
                          setLineItems(newLines);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="IMMEDIATE">Immediate (Upon Invoicing)</option>
              <option value="NET_15">NET 15 (15 days)</option>
              <option value="NET_30">NET 30 (30 days)</option>
              <option value="NET_60">NET 60 (60 days)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#3730A3] hover:bg-[#312E81] rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create in Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
