import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { formatPaise, rupeesToPaise } from '../../lib/money.js';
import { formatDate } from '../../lib/date.js';
import { Invoice, PaymentMethod } from '../../types/index.js';
import { InvoiceSheet } from '../../components/invoices/InvoiceSheet.js';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  ArrowLeft,
  Printer,
  Mail,
  CreditCard,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCustomer } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentRupees, setPaymentRupees] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // If customer, fetch from portal route; otherwise staff/admin route
      const endpoint = isCustomer ? `/portal/invoices/${id}` : `/invoices/${id}`;
      const res = await api.get(endpoint);
      const data: Invoice = res.data?.data;
      setInvoice(data);
      if (data) {
        const remaining = Math.max(0, data.total - data.amountPaid);
        setPaymentRupees((remaining / 100).toFixed(2));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Invoice not found or access denied.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id, isCustomer]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmInvoice = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/invoices/${id}/confirm`);
      setInvoice(res.data?.data);
      setSuccessMsg('Invoice confirmed and ready for payment collection.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Confirmation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) return;
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      setInvoice(res.data?.data);
      setSuccessMsg('Invoice has been cancelled.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Cancellation failed.');
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
      setSuccessMsg(`Invoice dispatched to ${invoice?.customer?.email}.`);
      fetchInvoice();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to send invoice.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const remainingBalance = Math.max(0, invoice.total - invoice.amountPaid);
    const amountInPaise = rupeesToPaise(paymentRupees);

    if (amountInPaise <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amountInPaise > remainingBalance) {
      setError(`Overpayment rejected! Maximum balance remaining is ${formatPaise(remainingBalance)}.`);
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
      setSuccessMsg('Payment successfully recorded and verified.');
      fetchInvoice();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to record payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-700" />
        <span>Loading invoice details...</span>
      </div>
    );
  }

  const backLink = isCustomer ? '/portal' : '/invoices';
  const backLabel = isCustomer ? 'Back to Portal' : 'Back to Invoices';

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white border border-slate-200 rounded-lg shadow-sm my-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-900 mb-1">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'This invoice does not exist or you do not have permission to view it.'}</p>
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>
      </div>
    );
  }

  const balanceDue = Math.max(0, invoice.total - invoice.amountPaid);

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* Screen-Only Action Header (PRD Section 8.2) */}
      <div className="no-print print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-700 font-medium transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Invoice {invoice.number}
            </h1>
            <span className="text-xs text-slate-500">
              Ref: <strong className="text-slate-800">{invoice.subscription?.number || invoice.subscriptionId}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button (Available to all roles) */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF View</span>
          </button>

          {/* Staff/Admin Exclusive Actions */}
          {!isCustomer && (
            <>
              {invoice.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Invoice</span>
                </button>
              )}

              {invoice.status === 'CONFIRMED' && (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSendInvoice}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Send by Email</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || balanceDue === 0}
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setPaymentRupees((balanceDue / 100).toFixed(2));
                      setIsPaymentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                </>
              )}

              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.amountPaid === 0 && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cancel Invoice</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Screen Notifications */}
      {error && (
        <div className="no-print print:hidden p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold text-slate-500 hover:text-slate-800">&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="no-print print:hidden p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="font-bold text-slate-500 hover:text-slate-800">&times;</button>
        </div>
      )}

      {/* The Printable Invoice Sheet */}
      <InvoiceSheet invoice={invoice} />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Customer Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-semibold text-slate-900">{formatPaise(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-semibold text-emerald-700">{formatPaise(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
              <span className="text-slate-700">Remaining Balance:</span>
              <span className="text-amber-700">{formatPaise(balanceDue)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 bg-white"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue / 100}
              required
              value={paymentRupees}
              onChange={(e) => setPaymentRupees(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Partial payments allowed. Entering the full balance marks invoice as Paid.
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
              placeholder="e.g. UTR #HDFC0029348 or Cheque #019283"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || rupeesToPaise(paymentRupees) <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
