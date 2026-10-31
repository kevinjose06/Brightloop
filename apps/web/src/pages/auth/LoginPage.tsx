import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { AlertCircle, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const user = res.data.data;
      login(user);
      if (user.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-xl mx-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
            B
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to Brightloop
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise subscription lifecycle and billing management
          </p>
        </div>

        {/* Demo Fast-fill Buttons for Hackathon Judges */}
        <div className="mt-6 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hackathon Quick-Login Roles:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@brightloop.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-medium text-indigo-700 rounded border border-indigo-200 transition-colors shadow-xs"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('staff@brightloop.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-medium text-indigo-700 rounded border border-indigo-200 transition-colors shadow-xs"
            >
              🧑‍💼 Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('customer@acme.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-medium text-indigo-700 rounded border border-indigo-200 transition-colors shadow-xs"
            >
              🏢 Customer
            </button>
          </div>
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create customer account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Sleek Product Showcase Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          <span>B2B Subscription & Invoicing Engine</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
            Precision Billing for High-Growth Enterprise SaaS.
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed">
            Automated recurring invoices, tax rule prioritization, atomic discount usage enforcement,
            and sub-second finance analytics backed by PostgreSQL row locking.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-800/60 text-xs">
            <div>
              <p className="font-bold text-white text-base">₹0 Minor Unit Loss</p>
              <p className="text-indigo-300 text-[11px]">Strict paise-based precision</p>
            </div>
            <div>
              <p className="font-bold text-white text-base">&lt; 2s Aggregates</p>
              <p className="text-indigo-300 text-[11px]">Indexed SQL aggregation</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control & Single-Use SHA-256 Tokens</span>
        </div>
      </div>
    </div>
  );
};

