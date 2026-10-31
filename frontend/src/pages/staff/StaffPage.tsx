import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { ShieldCheck, UserPlus, AlertCircle, CheckCircle2, Check, X } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLen = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasSpecial;

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not fulfill security requirements');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await api.post('/auth/staff', {
        name,
        email,
        password,
      });

      setSuccess(`Staff account successfully provisioned for ${email}`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create staff member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Stitch Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
            Administration
          </span>
          <span className="text-xs text-slate-400 font-mono">RBAC • Internal Provisioning</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
          Staff Account Provisioning
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Grant internal operations credentials with access to billing runs, quotations, and payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-card p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">Create New Staff Member</h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Staff"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff.member@brightloop.test"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 9 chars (upper, lower, special)"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />

              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1 text-[11px]">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-secondary font-medium' : 'text-slate-500'}`}>
                    {hasMinLen ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>9+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-secondary font-medium' : 'text-slate-500'}`}>
                    {hasUpper ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-secondary font-medium' : 'text-slate-500'}`}>
                    {hasLower ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-secondary font-medium' : 'text-slate-500'}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-secondary" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? 'Creating account...' : 'Provision Staff Account'}
            </button>
          </form>
        </div>

        {/* Security & Roles Explainer Card */}
        <div className="bg-white rounded-card p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Role & Permission Scope</span>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>Staff Capabilities:</strong>
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Create and confirm subscriptions</li>
              <li>Trigger automated billing runs</li>
              <li>Generate and print invoices</li>
              <li>Record incoming customer payments</li>
              <li>Manage customer company profiles</li>
            </ul>

            <div className="pt-3 border-t border-slate-100">
              <p className="font-semibold text-rose-600">Restricted to Admin Only:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 mt-1">
                <li>Catalog product and variant creation</li>
                <li>Plan pricing and lifecycle flag edits</li>
                <li>Tax rule adjustments</li>
                <li>Promotional discount creation</li>
                <li>Staff account creation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
