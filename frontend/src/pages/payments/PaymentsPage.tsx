import React, { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Payment } from '../../types/index.js';
import { CreditCard, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter(
    (p) =>
      p.invoice?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stitch Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
            Cash Inflow
          </span>
          <span className="text-xs text-slate-400 font-mono">Treasury • Reconciled Receipts</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
          Payment Audit & Settlements
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete record of all incoming wire transfers, UPI transactions, cards, and reconciled receipts
        </p>
      </div>

      <div className="bg-white p-3.5 rounded-card border border-slate-200/90 shadow-sm flex items-center gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number, method, or reference note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Paid Date</th>
              <th className="px-6 py-3.5">Target Invoice</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5">Reference / Note</th>
              <th className="px-6 py-3.5">Recorded By</th>
              <th className="px-6 py-3.5 text-right">Settled Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 font-mono">{formatDate(p.paidAt)}</td>
                <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                  <Link to={`/invoices/${p.invoiceId}`} className="text-primary hover:underline">
                    {p.invoice?.number}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-primary/10 text-primary border border-primary/20">
                    {p.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{p.note || '—'}</td>
                <td className="px-6 py-4 text-slate-500 truncate">{p.recordedBy?.email}</td>
                <td className="px-6 py-4 text-right font-bold text-secondary font-mono text-sm">
                  {formatCurrency(p.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
