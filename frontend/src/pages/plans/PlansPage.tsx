import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Plan, BillingPeriod } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Plus, Layers, Check, X, AlertCircle } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(2000); // ₹
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [minQuantity, setMinQuantity] = useState(1);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 10));
  const [availableTo, setAvailableTo] = useState('2030-12-31');

  // The 4 Core Behaviour Toggles (PRD §1, §6, §10.2 #4)
  const [autoClose, setAutoClose] = useState(false);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenew, setAllowRenew] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isAdmin } = useAuth();

  const fetchPlans = async () => {
    try {
      const res = await api.get('/catalog/plans');
      setPlans(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setPrice(2000);
    setBillingPeriod('MONTHLY');
    setMinQuantity(1);
    setAvailableFrom(new Date().toISOString().slice(0, 10));
    setAvailableTo('2030-12-31');
    setAutoClose(false);
    setAllowEarlyClose(true);
    setAllowPause(true);
    setAllowRenew(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/catalog/plans', {
        name,
        price: Math.round(price * 100),
        billingPeriod,
        minQuantity: Number(minQuantity),
        availableFrom,
        availableTo,
        autoClose,
        allowEarlyClose,
        allowPause,
        allowRenew,
      });

      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create plan');
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
              Pricing Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Catalog • Policies</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Subscription Plans & Cadence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure billing cycles, minimum volume thresholds, and customer self-service permission rules
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        )}
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Plan Name</th>
                <th className="px-6 py-3.5">Billing Cadence</th>
                <th className="px-6 py-3.5">Base Price</th>
                <th className="px-6 py-3.5">Min Qty</th>
                <th className="px-6 py-3.5">Availability</th>
                <th className="px-6 py-3.5">Lifecycle Policies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      {p.billingPeriod}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {p.minQuantity} seat{p.minQuantity > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    {formatDate(p.availableFrom)} – {formatDate(p.availableTo)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className={`inline-flex items-center gap-1 ${p.autoClose ? 'text-secondary font-semibold' : 'text-slate-400'}`}>
                        {p.autoClose ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5" />}
                        <span>Auto-Close</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 ${p.allowEarlyClose ? 'text-secondary font-semibold' : 'text-slate-400'}`}>
                        {p.allowEarlyClose ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5" />}
                        <span>Early Close</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 ${p.allowPause ? 'text-secondary font-semibold' : 'text-slate-400'}`}>
                        {p.allowPause ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5" />}
                        <span>Pause</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 ${p.allowRenew ? 'text-secondary font-semibold' : 'text-slate-400'}`}>
                        {p.allowRenew ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5" />}
                        <span>Renew</span>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription Plan"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Basic"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Period *
              </label>
              <select
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
                <option value="YEARLY">YEARLY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={minQuantity}
                onChange={(e) => setMinQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available From
              </label>
              <input
                type="date"
                required
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available To
              </label>
              <input
                type="date"
                required
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* The 4 Behaviour Toggles (PRD §1, §10.2 #4) */}
          <div className="pt-3 border-t border-slate-200">
            <span className="block text-xs font-semibold text-slate-800 mb-2">
              Subscription Lifecycle Rules & Flags
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Auto Close</span>
                  <span className="text-[10px] text-slate-500">Close automatically when expiryDate passes</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEarlyClose}
                  onChange={(e) => setAllowEarlyClose(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Early Close</span>
                  <span className="text-[10px] text-slate-500">Allow customer to cancel ahead of expiry</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Pause</span>
                  <span className="text-[10px] text-slate-500">Skip billing runs while isPaused is true</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRenew}
                  onChange={(e) => setAllowRenew(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Allow Renew</span>
                  <span className="text-[10px] text-slate-500">Allow extending expiry by plan period</span>
                </div>
              </label>
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
              {isLoading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
