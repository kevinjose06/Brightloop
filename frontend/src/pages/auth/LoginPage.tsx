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
      login(user, res.data.token);
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
    <div className="min-h-screen flex bg-[#FAF8FF] font-sans">
      {/* Left Column: Form matching Stitch AI */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-xl mx-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="w-10 h-10 rounded-xl bg-[#3730A3] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
            B
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#131B2E]">
            Sign in to Brightloop
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise subscription lifecycle and billing management platform
          </p>
        </div>

        {/* Demo Fast-fill Buttons */}
        <div className="mt-6 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3730A3] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Demo Account Role:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@brightloop.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-semibold text-[#3730A3] rounded-lg border border-indigo-200 transition-colors shadow-xs"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('staff@brightloop.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-semibold text-[#3730A3] rounded-lg border border-indigo-200 transition-colors shadow-xs"
            >
              🧑‍💼 Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('customer@acme.test')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-[11px] font-semibold text-[#3730A3] rounded-lg border border-indigo-200 transition-colors shadow-xs"
            >
              🏢 Customer
            </button>
          </div>
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#131B2E] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:border-[#3730A3] transition-all shadow-xs text-[#131B2E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#131B2E]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-[#3730A3] hover:underline"
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
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:border-[#3730A3] transition-all shadow-xs text-[#131B2E]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#3730A3] hover:bg-[#312E81] text-white text-xs font-semibold rounded-lg shadow-sm focus:outline-none transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-[#3730A3] hover:underline">
              Create customer account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Sleek Product Showcase Panel matching Stitch Precision Theme */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#3730A3] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-4 h-4 text-teal-400" />
          <span>Precision Billing Architecture</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
            Precision Billing for High-Growth Enterprise SaaS.
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed">
            Automated recurring invoices, tax rule prioritization, atomic discount usage enforcement,
            and sub-second finance analytics backed by PostgreSQL row locking.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-700/50 text-xs">
            <div>
              <p className="font-bold text-white text-base">₹0 Minor Unit Loss</p>
              <p className="text-indigo-200 text-[11px]">Strict integer paise precision</p>
            </div>
            <div>
              <p className="font-bold text-white text-base">&lt; 2s Aggregates</p>
              <p className="text-indigo-200 text-[11px]">Indexed SQL aggregation</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-300">
          <Shield className="w-4 h-4 text-teal-400" />
          <span>Multi-Tenant RBAC & Single-Use SHA-256 Tokens</span>
        </div>
      </div>
    </div>
  );
};
