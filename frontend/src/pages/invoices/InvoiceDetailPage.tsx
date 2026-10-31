import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Invoice, PaymentMethod } from '../../types/index.js';
import { StatusBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  ArrowLeft,
  Printer,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data);
      const remainingBalance = Math.max(0, res.data.data.total - res.data.data.amountPaid);
      setPaymentAmount(remainingBalance / 100);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch invoice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleConfirmInvoice = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/invoices/${id}/confirm`);
      setInvoice(res.data.data);
      setSuccessMsg('Invoice confirmed and ready for payment collection');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Confirmation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelInvoice = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      setInvoice(res.data.data);
      setSuccessMsg('Invoice cancelled');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Cancellation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvoice = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      await api.post(`/invoices/${id}/send`);
      setSuccessMsg(`Invoice dispatched to ${invoice?.customer?.email}`);
      fetchInvoice();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const remaining = invoice.total - invoice.amountPaid;
    const amountInPaise = Math.round(paymentAmount * 100);

    if (amountInPaise > remaining) {
      setError(`Cannot accept overpayment! Max balance remaining is ${formatCurrency(remaining)}`);
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      await api.post(`/invoices/${id}/payments`, {
        method: paymentMethod,
        amount: amountInPaise,
        note: paymentNote,
      });

      setIsPaymentModalOpen(false);
      setSuccessMsg('Payment successfully verified and recorded!');
      fetchInvoice();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 text-sm mb-4">Invoice record not found.</p>
        <Link to="/invoices" className="text-primary text-xs font-semibold hover:underline">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  const balanceDue = Math.max(0, invoice.total - invoice.amountPaid);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Invoices</span>
        </Link>

        {/* Stitch Context Banner */}
        <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {invoice.number}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Contract Ref:{' '}
              <Link
                to={`/subscriptions/${invoice.subscriptionId}`}
                className="text-primary hover:underline font-semibold font-mono"
              >
                {invoice.subscription?.number}
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/v1/invoices/${invoice.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF View</span>
            </a>

            {invoice.status === 'DRAFT' && (
              <button
                disabled={isProcessing}
                onClick={handleConfirmInvoice}
                className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Confirm Invoice
              </button>
            )}

            {invoice.status === 'CONFIRMED' && (
              <>
                <button
                  disabled={isProcessing}
                  onClick={handleSendInvoice}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send by Email</span>
                </button>

                <button
                  disabled={isProcessing || balanceDue === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary hover:bg-secondary/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </>
            )}

            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.amountPaid === 0 && (
              <button
                disabled={isProcessing}
                onClick={handleCancelInvoice}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Invoice Details Card */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To
            </span>
            <p className="font-bold text-slate-900 text-base">{invoice.customer?.name}</p>
            {invoice.customer?.company && (
              <p className="text-xs text-slate-600 font-medium">{invoice.customer?.company}</p>
            )}
            <p className="text-xs text-slate-500">{invoice.customer?.email}</p>
            {invoice.customer?.address && (
              <p className="text-xs text-slate-500">{invoice.customer?.address}</p>
            )}
            {invoice.customer?.taxId && (
              <p className="text-xs text-slate-500 mt-1 font-mono">GST/Tax: {invoice.customer?.taxId}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billing Period
            </span>
            <p className="font-semibold text-slate-800 font-mono">
              {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </p>
            <p className="text-slate-500">
              Issue Date: <span className="font-medium text-slate-700 font-mono">{formatDate(invoice.issueDate)}</span>
            </p>
            <p className="text-slate-500">
              Due Date: <span className="font-medium text-slate-700 font-mono">{formatDate(invoice.dueDate)}</span>
            </p>
            {invoice.sentAt && (
              <p className="text-primary text-[11px] font-mono">
                Dispatched via Email: {formatDate(invoice.sentAt)}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Lines Snapshot */}
        <div className="mt-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Tax</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines?.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-semibold text-slate-800">{line.description}</td>
                  <td className="py-3 px-3 text-center font-medium font-mono">{line.quantity}</td>
                  <td className="py-3 px-3 text-right text-slate-600 font-mono">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-3 px-3 text-right text-secondary font-mono">
                    {line.discountAmount > 0 ? `-${formatCurrency(line.discountAmount)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-mono">
                    {line.taxName ? `${line.taxName} (${line.taxRate}%): ${formatCurrency(line.taxAmount)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(line.amount - line.discountAmount + line.taxAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <div className="w-72 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span className="font-sans">Discounts Applied:</span>
              <span className="font-medium">-{formatCurrency(invoice.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Taxes:</span>
              <span className="font-medium text-slate-900">+{formatCurrency(invoice.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200 font-sans">
              <span>Invoice Total:</span>
              <span className="font-mono">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span className="font-sans">Total Paid:</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div
              className={`flex justify-between font-bold pt-2 border-t border-slate-100 ${
                balanceDue > 0 ? 'text-amber-700' : 'text-secondary'
              }`}
            >
              <span className="font-sans">Balance Remaining:</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Payments Ledger (PRD §8.5) */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Verified Payments Ledger</h3>
          <span className="text-xs text-slate-500 font-mono">{invoice.payments?.length || 0} Transactions</span>
        </div>

        {invoice.payments && invoice.payments.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Paid Date</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Reference / Note</th>
                <th className="px-6 py-3.5">Recorded By</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-800 font-mono">{formatDate(p.paidAt)}</td>
                  <td className="px-6 py-3.5 font-semibold text-primary">{p.method}</td>
                  <td className="px-6 py-3.5 text-slate-600">{p.note || '—'}</td>
                  <td className="px-6 py-3.5 text-slate-500 truncate">{p.recordedBy?.email}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-secondary font-mono">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No payments recorded yet for this invoice.
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Customer Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Invoice Total:</span>
              <span className="font-bold text-slate-900">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Already Paid:</span>
              <span className="font-bold text-secondary">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span className="font-semibold text-slate-700 font-sans">Max Acceptable Payment:</span>
              <span className="font-bold text-amber-700">{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="BANK_TRANSFER">BANK TRANSFER (NEFT / RTGS / Wire)</option>
              <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
              <option value="CARD">CREDIT / DEBIT CARD</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="CASH">CASH</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue / 100}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Partial payments allowed. Entering remaining balance automatically marks invoice as Paid.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Note
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g. Wire Ref #HDFC98234 or UPI ID"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || paymentAmount <= 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'Verifying...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
