import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import { AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Column: Clean Minimal Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0A0F1D] text-white p-12 lg:p-16 flex-col justify-center relative overflow-hidden select-none">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* Center Content */}
        <div className="relative z-10 max-w-lg space-y-6 mx-auto">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Precision billing for modern subscription businesses.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Manage recurring lifecycle contracts, automated invoicing, tax calculation, and self-service account settlement in one unified workspace.
          </p>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 max-w-xl mx-auto w-full">
        <div>
          {/* Logo & Heading */}
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg mb-6 shadow-sm">
            B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to Brightloop
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your credentials to access your billing and subscription workspace
          </p>
        </div>

        {/* Demo Fast-fill Selector */}
        <div className="mt-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="block text-[11px] font-semibold text-slate-500 mb-2">
            Select Demo Account:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@brightloop.test')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                email === 'admin@brightloop.test'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('staff@brightloop.test')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                email === 'staff@brightloop.test'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40'
              }`}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('customer@acme.test')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                email === 'customer@acme.test'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40'
              }`}
            >
              Customer
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-medium text-primary hover:underline"
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
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer pt-2.5"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create customer account
          </Link>
        </p>
      </div>
    </div>
  );
};
