import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { TaxRule, Discount, Product, DiscountKind, DiscountScope, ProductType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Plus, Percent, Tag, AlertCircle } from 'lucide-react';

export const TaxesDiscountsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TAXES' | 'DISCOUNTS'>('DISCOUNTS');
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Tax Form
  const [taxName, setTaxName] = useState('');
  const [ratePercent, setRatePercent] = useState(18);
  const [productType, setProductType] = useState<ProductType | ''>('SOFTWARE');
  const [priority, setPriority] = useState(10);

  // Discount Form
  const [discountName, setDiscountName] = useState('');
  const [kind, setKind] = useState<DiscountKind>('PERCENT');
  const [discountValue, setDiscountValue] = useState(10); // 10% or ₹500
  const [minPurchase, setMinPurchase] = useState<number | ''>('');
  const [minQuantity, setMinQuantity] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('2030-12-31');
  const [usageLimit, setUsageLimit] = useState<number | ''>(10);
  const [scope, setScope] = useState<DiscountScope>('PRODUCT');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [taxRes, discRes, prodRes] = await Promise.all([
        api.get('/catalog/taxes'),
        api.get('/catalog/discounts'),
        api.get('/catalog/products'),
      ]);
      setTaxes(taxRes.data.data);
      setDiscounts(discRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await api.post('/catalog/taxes', {
        name: taxName,
        ratePercent: Number(ratePercent),
        productType: productType || null,
        priority: Number(priority),
      });
      setIsTaxModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create tax rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const valuePaiseOrPercent =
        kind === 'FIXED' ? Math.round(Number(discountValue) * 100) : Number(discountValue);

      await api.post('/catalog/discounts', {
        name: discountName,
        kind,
        value: valuePaiseOrPercent,
        minPurchase: minPurchase ? Math.round(Number(minPurchase) * 100) : null,
        minQuantity: minQuantity ? Number(minQuantity) : null,
        startDate,
        endDate,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        scope,
        productIds: scope === 'PRODUCT' && selectedProductId ? [selectedProductId] : [],
      });
      setIsDiscountModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create discount');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stitch Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
              Fiscal Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Tax Slabs • Promotional Logic</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Taxes & Promotional Discounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated tax calculation priority and atomic discount redemption controls
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => (activeTab === 'TAXES' ? setIsTaxModalOpen(true) : setIsDiscountModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New {activeTab === 'TAXES' ? 'Tax Rule' : 'Discount Rule'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('DISCOUNTS')}
          className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'DISCOUNTS'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Discounts & Promos ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTab('TAXES')}
          className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'TAXES'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tax Rules & Rates ({taxes.length})
        </button>
      </div>

      {/* Discounts Tab */}
      {activeTab === 'DISCOUNTS' && (
        <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Discount Name</th>
                <th className="px-6 py-3.5">Type & Value</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Usage Progress</th>
                <th className="px-6 py-3.5">Valid Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d) => {
                const isExhausted = d.usageLimit !== null && d.usageLimit !== undefined && d.usedCount >= d.usageLimit;
                const percentUsed = d.usageLimit ? Math.min(100, (d.usedCount / d.usageLimit) * 100) : 0;

                return (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{d.name}</span>
                          {d.minQuantity && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Requires min {d.minQuantity} seats
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">
                      {d.kind === 'FIXED' ? formatCurrency(d.value) : `${d.value}% Off`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {d.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-44">
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className={isExhausted ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {d.usedCount} / {d.usageLimit ?? '∞'} used
                          </span>
                          {isExhausted && (
                            <span className="text-[10px] uppercase font-bold text-rose-600">
                              Exhausted
                            </span>
                          )}
                        </div>
                        {d.usageLimit && (
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percentUsed}%` }}
                              className={`h-full rounded-full transition-all ${
                                isExhausted ? 'bg-rose-500' : 'bg-primary'
                              }`}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(d.startDate)} – {formatDate(d.endDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'TAXES' && (
        <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Tax Rule Name</th>
                <th className="px-6 py-3.5">Rate Percent</th>
                <th className="px-6 py-3.5">Applicable Product Type</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Percent className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">{t.ratePercent}%</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      {t.productType || 'All Product Types'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 font-mono">{t.priority}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Tax Modal */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title="Add Tax Rule"
      >
        <form onSubmit={handleCreateTax} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tax Rule Name *
            </label>
            <input
              type="text"
              required
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="e.g. GST Software 18%"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate Percent (%) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={ratePercent}
                onChange={(e) => setRatePercent(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Type Scoping
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType | '')}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Apply to All Product Types</option>
              <option value="SOFTWARE">SOFTWARE</option>
              <option value="SERVICE">SERVICE</option>
              <option value="ADDON">ADDON</option>
              <option value="PHYSICAL">PHYSICAL</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saving...' : 'Create Tax Rule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Discount Modal */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Create Promotional Discount"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discount Name *
            </label>
            <input
              type="text"
              required
              value={discountName}
              onChange={(e) => setDiscountName(e.target.value)}
              placeholder="e.g. Volume 10% Discount"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as DiscountKind)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FIXED">FIXED AMOUNT (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Value ({kind === 'PERCENT' ? '%' : '₹'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scope *
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as DiscountScope)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="SUBSCRIPTION">Entire Subscription</option>
                <option value="PRODUCT">Specific Product Line</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Usage Limit (Blank = Unlimited)
              </label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g. 3 uses max"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {scope === 'PRODUCT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eligible Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create Discount'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
