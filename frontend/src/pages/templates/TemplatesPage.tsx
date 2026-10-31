import React, { useState, useEffect } from 'react';
import { api, formatCurrency } from '../../lib/api.js';
import { QuotationTemplate, Plan, Product } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { Plus, FileSpreadsheet, Trash2, AlertCircle } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [planId, setPlanId] = useState('');
  const [lines, setLines] = useState<Array<{ productId: string; variantId?: string; quantity: number }>>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [tplRes, plansRes, prodsRes] = await Promise.all([
        api.get('/catalog/quotation-templates'),
        api.get('/catalog/plans'),
        api.get('/catalog/products'),
      ]);
      setTemplates(tplRes.data.data);
      setPlans(plansRes.data.data);
      setProducts(prodsRes.data.data);
      if (plansRes.data.data.length > 0 && !planId) {
        setPlanId(plansRes.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setValidityDays(30);
    if (plans.length > 0) setPlanId(plans[0].id);
    if (products.length > 0) {
      setLines([{ productId: products[0].id, quantity: 1 }]);
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddLine = () => {
    if (products.length > 0) {
      setLines([...lines, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError('Please add at least one product line item');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.post('/catalog/quotation-templates', {
        name,
        validityDays: Number(validityDays),
        planId,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: Number(l.quantity),
        })),
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create template');
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
              Proposals
            </span>
            <span className="text-xs text-slate-400 font-mono">Catalog • Predefined Bundles</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Quotation Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard sales bundles that copy predefined plan and line items directly into fresh proposals
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-card p-5 border border-slate-200/90 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  Valid {t.validityDays} Days
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.name}</h3>
              <p className="text-xs text-primary font-semibold mb-3">
                Plan: {t.plan?.name} ({formatCurrency(t.plan?.price)} / {t.plan?.billingPeriod})
              </p>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Preset Line Items:
                </span>
                {t.lines?.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[200px]">
                      {l.product?.name} {l.variant ? `(${l.variant.value})` : ''}
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">Qty: {l.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Quotation Template"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Template Bundle Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard CRM + Analytics Bundle"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Validity (Days) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Lines */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                Included Products & Quantities
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].productId = e.target.value;
                        updated[idx].variantId = undefined;
                        setLines(updated);
                      }}
                      className="w-1/2 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    {prod && prod.variants.length > 0 && (
                      <select
                        value={line.variantId || ''}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].variantId = e.target.value || undefined;
                          setLines(updated);
                        }}
                        className="w-1/3 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Standard (No Variant)</option>
                        {prod.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.value} (+{formatCurrency(v.extraPrice)})
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setLines(updated);
                      }}
                      className="w-20 text-xs px-2 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
