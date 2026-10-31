import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.data?.devToken) {
        setDevToken(res.data.devToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-card border border-slate-200 shadow-soft p-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 font-medium mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 mb-6">
          Enter your registered email address and we'll dispatch a single-use reset token.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instructions Dispatched</span>
              </div>
              <p>
                If that email exists in our system, a password reset link has been sent. The token
                is valid for 1 hour.
              </p>
            </div>

            {devToken && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md text-xs space-y-2">
                <p className="font-semibold text-indigo-900">Development Mode Token:</p>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-500"
                  >
                    Click to Open Reset Form
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? 'Dispatching email...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

