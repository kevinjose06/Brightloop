import React from 'react';
import { Invoice } from '../../types/index.js';
import { StatusBadge } from '../common/Badge.js';
import { COMPANY_CONFIG } from '../../config/company.js';
import { formatPaise } from '../../lib/money.js';
import { formatDate } from '../../lib/date.js';
import { Building2, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

interface InvoiceSheetProps {
  invoice: Invoice;
}

export const InvoiceSheet: React.FC<InvoiceSheetProps> = ({ invoice }) => {
  const balanceDue = Math.max(0, invoice.total - invoice.amountPaid);
  const isPaid = invoice.status === 'PAID' || balanceDue === 0;
  const isDraft = invoice.status === 'DRAFT';
  const isCancelled = invoice.status === 'CANCELLED';

  // Aggregate taxes from line items to produce an itemized tax summary
  const taxSummary = invoice.lines.reduce<Record<string, { name: string; rate: number; amount: number }>>(
    (acc, line) => {
      if (line.taxName && line.taxAmount > 0) {
        const key = `${line.taxName}-${line.taxRate ?? 0}`;
        if (!acc[key]) {
          acc[key] = {
            name: line.taxName,
            rate: line.taxRate ?? 0,
            amount: 0,
          };
        }
        acc[key].amount += line.taxAmount;
      }
      return acc;
    },
    {}
  );
  const taxBreakdownList = Object.values(taxSummary);

  return (
    <div className="invoice-sheet bg-white rounded-lg border border-slate-200 shadow-sm p-8 sm:p-10 max-w-4xl mx-auto print:p-0 print:border-0 print:shadow-none print:max-w-none text-slate-900 font-sans">
      {/* Draft / Cancelled Watermark Banner for Print */}
      {isDraft && (
        <div className="mb-6 p-2.5 bg-amber-50 border border-amber-300 rounded text-center text-amber-900 text-xs font-semibold tracking-wider uppercase print:border-amber-400">
          Draft Invoice — Not Yet Finalized
        </div>
      )}
      {isCancelled && (
        <div className="mb-6 p-2.5 bg-rose-50 border border-rose-300 rounded text-center text-rose-900 text-xs font-semibold tracking-wider uppercase print:border-rose-400">
          Cancelled Invoice — Void
        </div>
      )}

      {/* 1. Header: Company & Invoice Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-sm print:bg-indigo-700 print-color">
              B
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {COMPANY_CONFIG.name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">{COMPANY_CONFIG.tagline}</p>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">
            <p>{COMPANY_CONFIG.address.line1}, {COMPANY_CONFIG.address.line2}</p>
            <p>{COMPANY_CONFIG.address.city}, {COMPANY_CONFIG.address.state} {COMPANY_CONFIG.address.postalCode}, {COMPANY_CONFIG.address.country}</p>
            <p className="mt-0.5">
              Email: <span className="text-slate-800">{COMPANY_CONFIG.contact.email}</span> | Phone: {COMPANY_CONFIG.contact.phone}
            </p>
            <p className="font-medium text-slate-700">GSTIN: {COMPANY_CONFIG.tax.gstin} | PAN: {COMPANY_CONFIG.tax.pan}</p>
          </div>
        </div>

        <div className="sm:text-right space-y-1.5 shrink-0">
          <div className="inline-block text-right">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700 block mb-0.5">
              Tax Invoice
            </span>
            <div className="flex items-center sm:justify-end gap-2.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {invoice.number}
              </span>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-0.5 pt-1">
            <p>
              <span className="text-slate-500">Issue Date:</span>{' '}
              <strong className="text-slate-800">{formatDate(invoice.issueDate)}</strong>
            </p>
            <p>
              <span className="text-slate-500">Payment Due:</span>{' '}
              <strong className="text-slate-800">{formatDate(invoice.dueDate)}</strong>
            </p>
            {invoice.sentAt && (
              <p className="text-[11px] text-slate-500">
                Dispatched: {formatDate(invoice.sentAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2 & 3. Bill To & Subscription Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Billed To (Customer)
          </span>
          <div className="space-y-1 text-slate-700">
            <p className="text-sm font-bold text-slate-900">{invoice.customer?.name}</p>
            {invoice.customer?.company && (
              <p className="font-medium text-slate-800">{invoice.customer.company}</p>
            )}
            <p className="text-slate-600">{invoice.customer?.email}</p>
            {invoice.customer?.phone && (
              <p className="text-slate-600">{invoice.customer.phone}</p>
            )}
            {invoice.customer?.address && (
              <p className="text-slate-600 leading-relaxed">{invoice.customer.address}</p>
            )}
            {invoice.customer?.taxId && (
              <p className="font-semibold text-slate-800 pt-1">
                GST / Tax ID: <span className="font-mono">{invoice.customer.taxId}</span>
              </p>
            )}
          </div>
        </div>

        <div className="sm:text-right space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Contract & Billing Period Reference
          </span>
          <div className="space-y-1 text-slate-700">
            <p>
              <span className="text-slate-500">Subscription Ref:</span>{' '}
              <strong className="text-slate-900 font-mono">
                {invoice.subscription?.number || invoice.subscriptionId}
              </strong>
            </p>
            {invoice.subscription?.plan && (
              <p>
                <span className="text-slate-500">Plan:</span>{' '}
                <strong className="text-slate-800">{invoice.subscription.plan.name}</strong>{' '}
                <span className="text-slate-500">
                  ({formatPaise(invoice.subscription.plan.price)} / {invoice.subscription.plan.billingPeriod.toLowerCase()})
                </span>
              </p>
            )}
            <p>
              <span className="text-slate-500">Period:</span>{' '}
              <span className="font-medium text-slate-900">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </span>
            </p>
            {invoice.subscription?.paymentTerms && (
              <p>
                <span className="text-slate-500">Payment Terms:</span>{' '}
                <span className="font-medium text-slate-800">
                  {invoice.subscription.paymentTerms.replace('_', ' ')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Line Items Table */}
      <div className="py-6">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-600">
            <tr>
              <th className="py-2.5 px-3 w-8 text-center text-slate-400">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-center w-16">Qty</th>
              <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-24">Discount</th>
              <th className="py-2.5 px-3 text-right w-36">Tax Applied</th>
              <th className="py-2.5 px-3 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lines && invoice.lines.length > 0 ? (
              invoice.lines.map((line, idx) => {
                const lineNet = line.amount - (line.discountAmount || 0) + (line.taxAmount || 0);
                return (
                  <tr key={line.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block">{line.description}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-800">
                      {line.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {formatPaise(line.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {line.discountAmount > 0 ? (
                        <span className="font-medium text-emerald-700">
                          -{formatPaise(line.discountAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {line.taxName ? (
                        <div>
                          <span>{line.taxName}</span>
                          {line.taxRate != null && <span> ({line.taxRate}%)</span>}
                          <span className="block font-medium text-slate-800">
                            +{formatPaise(line.taxAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      {formatPaise(lineNet)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No line items on this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Totals Block (Right-aligned) */}
      <div className="pt-4 pb-6 border-t border-slate-200 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-medium text-slate-900">{formatPaise(invoice.subtotal)}</span>
          </div>

          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discounts Deducted:</span>
              <span>-{formatPaise(invoice.discountTotal)}</span>
            </div>
          )}

          {taxBreakdownList.length > 0 ? (
            taxBreakdownList.map((t, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>{t.name} ({t.rate}%):</span>
                <span className="font-medium text-slate-800">+{formatPaise(t.amount)}</span>
              </div>
            ))
          ) : invoice.taxTotal > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span>Taxes:</span>
              <span className="font-medium text-slate-800">+{formatPaise(invoice.taxTotal)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-400">
              <span>Tax (0%):</span>
              <span>₹0.00</span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Invoice Total:</span>
            <span>{formatPaise(invoice.total)}</span>
          </div>

          <div className="flex justify-between text-slate-600 pt-1">
            <span>Amount Paid:</span>
            <span className="font-semibold text-slate-900">{formatPaise(invoice.amountPaid)}</span>
          </div>

          <div
            className={`flex justify-between text-sm font-bold pt-2 border-t border-slate-200 print-color ${
              balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            <span>Balance Due:</span>
            <span>{formatPaise(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* 6. Payments History (Compact) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="py-4 border-t border-slate-200">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
            Payment Transaction History
          </h4>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3">Reference / Note</th>
                <th className="py-2 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 px-3 text-slate-800">{formatDate(p.paidAt)}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{p.method.replace('_', ' ')}</td>
                  <td className="py-2 px-3 text-slate-600">{p.note || 'Verified'}</td>
                  <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                    {formatPaise(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Footer: Terms, Banking & Thank You */}
      <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700">Payment Instructions & Bank Wire:</p>
            <p>
              Bank: {COMPANY_CONFIG.bankDetails.bankName} | A/C: {COMPANY_CONFIG.bankDetails.accountNumber} | IFSC: {COMPANY_CONFIG.bankDetails.ifsc}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-semibold text-slate-700">Support & Inquiries:</p>
            <p>{COMPANY_CONFIG.contact.supportEmail} | {COMPANY_CONFIG.contact.phone}</p>
          </div>
        </div>
        <p className="text-center pt-3 text-slate-400 text-[11px] border-t border-slate-100">
          Thank you for choosing Brightloop. This is a computer-generated tax invoice.
        </p>
      </div>
    </div>
  );
};
