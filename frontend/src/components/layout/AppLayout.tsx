import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { Modal } from '../common/Modal.js';
import { api } from '../../lib/api.js';
import { PlayCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    evaluated: number;
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const location = useLocation();

  const handleRunBilling = async () => {
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const res = await api.post('/billing/run', {
        targetDate: new Date(targetDate).toISOString(),
      });
      setRunResult(res.data?.data);
    } catch (err: any) {
      setRunError(err.response?.data?.error?.message || 'Failed to execute billing run');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
      <Sidebar onOpenBillingModal={() => setIsBillingModalOpen(true)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible print:w-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 print:p-0 print:m-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>

      {/* Manual Billing Engine Run Modal (Demo Gold - PRD §4, §10.2 #9) */}
      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => {
          setIsBillingModalOpen(false);
          setRunResult(null);
          setRunError(null);
        }}
        title="Execute Automated Billing Run"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            The billing engine processes all active subscriptions due on or before the target date.
            It generates tax and discount snapshots, advances billing periods, and enforces idempotency
            to prevent duplicate invoices.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Billing Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {runResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Billing cycle finished successfully!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-200">
                <div>Subscriptions Evaluated: <strong>{runResult.evaluated}</strong></div>
                <div>Invoices Generated: <strong>{runResult.created}</strong></div>
                <div>Skipped (Already billed): <strong>{runResult.skipped}</strong></div>
                <div>Failed: <strong>{runResult.failed}</strong></div>
              </div>
            </div>
          )}

          {runError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{runError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBillingModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={handleRunBilling}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-md shadow-sm"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing batch...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Run Billing Engine</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

