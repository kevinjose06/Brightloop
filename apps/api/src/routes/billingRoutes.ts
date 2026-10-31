import { Router, Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService.js';
import { PaymentService } from '../services/paymentService.js';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth.js';
import { runBillingSchema, createPaymentSchema } from '../validators/invoice.js';
import { listQuerySchema } from '../validators/subscription.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// BILLING RUNS
router.post('/billing/run', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = runBillingSchema.parse(req.body);
    const result = await BillingService.runBilling(data.targetDate, data.subscriptionId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/billing/runs', requireAuth, requireStaffOrAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await prisma.billingRun.findMany({
      orderBy: { runAt: 'desc' },
      take: 20,
    });
    res.json({ data: runs });
  } catch (err) {
    next(err);
  }
});

// INVOICES
router.get('/invoices', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await BillingService.listInvoices({
      page: query.page,
      pageSize: query.pageSize,
      customerId: query.customerId,
      status: query.status as any,
      q: query.q,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await BillingService.getInvoice(req.params.id);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post('/invoices/:id/confirm', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await BillingService.confirmInvoice(req.params.id, req.user!.id);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post('/invoices/:id/cancel', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await BillingService.cancelInvoice(req.params.id, req.user!.id);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

router.post('/invoices/:id/send', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BillingService.sendInvoice(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id/print', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerIdScope = req.user?.role === 'CUSTOMER' ? req.user.customerId! : undefined;
    const invoice = await BillingService.getInvoice(req.params.id, customerIdScope);

    const formattedTotal = (invoice.total / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });

    const linesHtml = invoice.lines
      .map(
        (l) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px">${l.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:14px">${l.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px">₹${(l.unitPrice / 100).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px">₹${(l.discountAmount / 100).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px">${l.taxName ? `${l.taxName} (${l.taxRate}%)` : '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;font-size:14px">₹${((l.amount - l.discountAmount + l.taxAmount) / 100).toFixed(2)}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.number} — Brightloop</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
    .brand { font-size: 26px; font-weight: 800; color: #4f46e5; }
    .meta { text-align: right; }
    .grid { display: flex; justify-content: space-between; margin: 28px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f8fafc; padding: 10px 12px; font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .totals { margin-top: 24px; margin-left: auto; width: 320px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .total-row { border-top: 2px solid #e2e8f0; padding-top: 10px; font-size: 18px; font-weight: 700; color: #0f172a; }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:800px;margin:0 auto 16px;text-align:right">
    <button onclick="window.print()" style="padding:8px 16px;background:#4F46E5;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">Print Invoice</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">BRIGHTLOOP</div>
        <p style="margin:4px 0;color:#64748b;font-size:13px">Subscription Management Platform</p>
      </div>
      <div class="meta">
        <h2 style="margin:0;color:#0f172a;font-size:22px">INVOICE</h2>
        <p style="margin:4px 0;font-weight:600">${invoice.number}</p>
        <p style="margin:2px 0;color:#64748b;font-size:13px">Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
        <p style="margin:2px 0;color:#64748b;font-size:13px">Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;margin-top:6px;${
          invoice.status === 'PAID'
            ? 'background:#dcfce7;color:#15803d'
            : invoice.status === 'CONFIRMED'
            ? 'background:#fef3c7;color:#b45309'
            : 'background:#f1f5f9;color:#475569'
        }">${invoice.status}</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <p style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;margin:0 0 6px">Billed To:</p>
        <p style="margin:0;font-weight:600;font-size:15px">${invoice.customer.name}</p>
        ${invoice.customer.company ? `<p style="margin:2px 0;font-size:14px">${invoice.customer.company}</p>` : ''}
        <p style="margin:2px 0;font-size:14px;color:#64748b">${invoice.customer.email}</p>
        ${invoice.customer.address ? `<p style="margin:2px 0;font-size:14px;color:#64748b">${invoice.customer.address}</p>` : ''}
        ${invoice.customer.taxId ? `<p style="margin:2px 0;font-size:14px;color:#64748b">Tax ID: ${invoice.customer.taxId}</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;margin:0 0 6px">Subscription Details:</p>
        <p style="margin:0;font-weight:600;font-size:14px">${invoice.subscription.number}</p>
        <p style="margin:2px 0;font-size:13px;color:#64748b">Plan: ${invoice.subscription.plan.name}</p>
        <p style="margin:2px 0;font-size:13px;color:#64748b">Period: ${new Date(invoice.periodStart).toLocaleDateString()} to ${new Date(invoice.periodEnd).toLocaleDateString()}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align:left">Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Discount</th>
          <th style="text-align:right">Tax</th>
          <th style="text-align:right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal:</span><span>₹${(invoice.subtotal / 100).toFixed(2)}</span></div>
      <div class="row" style="color:#16a34a"><span>Discounts:</span><span>-₹${(invoice.discountTotal / 100).toFixed(2)}</span></div>
      <div class="row"><span>Taxes:</span><span>+₹${(invoice.taxTotal / 100).toFixed(2)}</span></div>
      <div class="row total-row"><span>Total Due:</span><span>${formattedTotal}</span></div>
      <div class="row" style="color:#64748b;margin-top:4px"><span>Amount Paid:</span><span>₹${(invoice.amountPaid / 100).toFixed(2)}</span></div>
      <div class="row" style="font-weight:600;color:${invoice.total - invoice.amountPaid > 0 ? '#b45309' : '#15803d'}">
        <span>Balance Due:</span><span>₹${((invoice.total - invoice.amountPaid) / 100).toFixed(2)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

// PAYMENTS
router.post('/invoices/:id/payments', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPaymentSchema.parse(req.body);
    const result = await PaymentService.recordPayment({
      invoiceId: req.params.id,
      method: data.method,
      amount: data.amount,
      paidAt: data.paidAt,
      note: data.note,
      actorId: req.user!.id,
    });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/payments', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await PaymentService.listPayments({
      invoiceId: req.query.invoiceId as string,
      customerId: req.query.customerId as string,
    });
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
});

export const billingRoutes = router;

