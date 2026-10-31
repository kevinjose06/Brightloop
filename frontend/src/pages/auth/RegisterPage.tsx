import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { AlertCircle, Check, X, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Live password validation checklist (PRD §1, §10.2 #1)
  const hasMinLen = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name,
        company,
        email,
        phone,
        address,
        taxId,
        password,
      });

      login(res.data.data);
      navigate('/portal');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 py-12 px-6">
      <div className="max-w-xl w-full mx-auto bg-white rounded-card border border-slate-200/80 shadow-soft p-8">
        <div className="mb-6">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-3">
            B
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Customer Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign up to manage subscriptions, view invoices, and track billing history
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acme.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Suite 500, Cyber Towers, Bengaluru, KA"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GST / Tax Identification Number
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="29ABCDE1234F1Z5"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 9 chars (upper, lower, special)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />

            {/* Live Password Rule Checklist (PRD §1, §10.2 #1) */}
            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5 text-[11px]">
              <p className="font-semibold text-slate-700 text-xs flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Password Requirements (PRD Spec):</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasMinLen ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Minimum 9 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Special character</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 mt-6"
          >
            <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

