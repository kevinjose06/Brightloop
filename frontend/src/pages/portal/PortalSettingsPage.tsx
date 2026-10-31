import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Settings, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const PortalSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/portal/profile');
        const c = res.data.data;
        setPhone(c.phone ?? '');
        setAddress(c.address ?? '');
        setTaxId(c.taxId ?? '');
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load profile. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (value && digits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (phone && digits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.patch('/portal/profile', { phone, address, taxId });
      setSuccessMsg('Profile updated successfully.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to update profile.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
            Account
          </span>
          <span className="text-xs text-slate-400 font-mono">Self-Service Settings</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update your billing address, contact phone, and GST/Tax identification for invoicing.
        </p>
      </div>

      {/* Read-only identity */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Identity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Name</span>
            <span className="font-semibold text-slate-900">{user?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Name and email are managed by your account administrator.
        </p>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Billing Details
        </h2>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  validatePhone(e.target.value);
                }}
                placeholder="9876543210"
                maxLength={10}
                className={`w-full text-xs px-3 py-2.5 border rounded-lg font-mono focus:outline-none focus:ring-1 transition-all ${
                  phoneError
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-primary focus:border-primary'
                }`}
              />
              {phoneError && (
                <p className="text-[11px] text-rose-600 mt-1">{phoneError}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">10-digit mobile number without country code.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Business Park, Bengaluru, Karnataka 560001"
                rows={3}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST / Tax ID
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your GSTIN or tax registration number for invoice generation.
              </p>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving || !!phoneError}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

