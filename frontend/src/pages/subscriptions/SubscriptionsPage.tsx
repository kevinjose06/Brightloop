import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Subscription, Customer, Plan, QuotationTemplate, Product, SubscriptionStatus, PaymentTerms } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { Plus, Repeat, Search, Filter, AlertCircle, ArrowRight, PauseCircle, Trash2 } from 'lucide-react';

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
      const payload: any = {
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        templateId: selectedTemplateId || null,
        startDate,
        expiryDate,
        paymentTerms,
      };

      // If creating blank, supply configured line items
      if (!selectedTemplateId) {
        if (lineItems.length === 0) {
          setError('Please add at least one line item to this subscription');
          setIsLoading(false);
          return;
        }
        payload.lines = lineItems.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
        }));
      }

      await api.post('/subscriptions', payload);

      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initialize subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Subscriptions Directory
          </h1>
          <p className="text-xs text-slate-500">
            Manage recurring lifecycle contracts, state transitions, lines, and billing schedules
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-card border border-slate-200/80 shadow-soft flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SUB-# or customer name..."
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
          <option value="QUOTATION">QUOTATION</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Subscription #</th>
                <th className="px-6 py-3">Customer Account</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Next Invoice</th>
                <th className="px-6 py-3">Expiry Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <Link
                      to={`/subscriptions/${sub.id}`}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                    >
                      <span>{sub.number}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 block">{sub.customer?.name}</span>
                    <span className="text-[11px] text-slate-400">{sub.customer?.company}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800 block">{sub.plan?.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {formatCurrency(sub.plan?.price)} / {sub.plan?.billingPeriod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={sub.status} />
                      {sub.isPaused && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <PauseCircle className="w-3 h-3" /> Paused
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {formatDate(sub.nextInvoiceDate)}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(sub.expiryDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/subscriptions/${sub.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Subscription"
        maxWidth="max-w-xl"
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
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
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
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Start Blank (Manual Lines)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Picker when Start Blank is selected */}
          {!selectedTemplateId ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Subscription Line Items & Products *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (products.length > 0) {
                      setLineItems([...lineItems, { productId: products[0].id, variantId: '', quantity: 1 }]);
                    }
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {lineItems.map((item, idx) => {
                  const selectedProduct = products.find((p) => p.id === item.productId);
                  const variants = selectedProduct?.variants || [];

                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const next = [...lineItems];
                              next[idx].productId = e.target.value;
                              next[idx].variantId = '';
                              setLineItems(next);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatCurrency(p.salesPrice)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Variant (e.g. Brand)</label>
                          <select
                            value={item.variantId}
                            onChange={(e) => {
                              const next = [...lineItems];
                              next[idx].variantId = e.target.value;
                              setLineItems(next);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Base / Standard (+₹0)</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.attribute}: {v.value} (+{formatCurrency(v.extraPrice)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 font-medium">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const next = [...lineItems];
                              next[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              setLineItems(next);
                            }}
                            className="w-16 text-xs px-2 py-1 bg-white border border-slate-300 rounded text-center font-medium"
                          />
                        </div>

                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                            className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-md text-xs text-indigo-700 flex items-center gap-2">
              <Repeat className="w-4 h-4 shrink-0" />
              <span>
                Pre-configured products and quantities from <strong>{templates.find((t) => t.id === selectedTemplateId)?.name}</strong> will be cloned into this contract.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Terms
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="IMMEDIATE">IMMEDIATE (Due on issue)</option>
              <option value="NET_15">NET 15 (15 days)</option>
              <option value="NET_30">NET 30 (30 days)</option>
              <option value="NET_60">NET 60 (60 days)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create in Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
