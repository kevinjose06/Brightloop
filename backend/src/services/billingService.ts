import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import {
  BillingPeriod,
  InvoiceStatus,
  PaymentTerms,
  DiscountKind,
  SubscriptionStatus,
} from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears, differenceInDays } from 'date-fns';
import { sendEmail } from '../lib/mailer.js';
import { logger } from '../lib/logger.js';

export interface BillingRunResult {
  runId: string;
  evaluated: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ subscriptionId: string; error: string }>;
}

export class BillingService {
  private static async getNextInvoiceNumber(): Promise<string> {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  private static calculateDueDate(issueDate: Date, terms: PaymentTerms): Date {
    switch (terms) {
      case PaymentTerms.NET_15:
        return addDays(issueDate, 15);
      case PaymentTerms.NET_30:
        return addDays(issueDate, 30);
      case PaymentTerms.NET_60:
        return addDays(issueDate, 60);
      case PaymentTerms.IMMEDIATE:
      default:
        return issueDate;
    }
  }

  private static calculateNextPeriod(start: Date, period: BillingPeriod): { end: Date; nextStart: Date } {
    let nextStart: Date;
    switch (period) {
      case BillingPeriod.DAILY:
        nextStart = addDays(start, 1);
        break;
      case BillingPeriod.WEEKLY:
        nextStart = addWeeks(start, 1);
        break;
      case BillingPeriod.MONTHLY:
        nextStart = addMonths(start, 1);
        break;
      case BillingPeriod.YEARLY:
        nextStart = addYears(start, 1);
        break;
    }
    const end = addDays(nextStart, -1);
    return { end, nextStart };
  }

  /**
   * Core Billing Engine
   * Idempotent, handles catch-ups, snapshot lines, atomic discount limits, tax rules.
   */
  static async runBilling(targetDate: Date = new Date(), targetSubId?: string): Promise<BillingRunResult> {
    const run = await prisma.billingRun.create({
      data: {
        runAt: new Date(),
        status: 'PROCESSING',
      },
    });

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: Array<{ subscriptionId: string; error: string }> = [];

    // Query active, unpaused subscriptions due on or before targetDate
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        id: targetSubId ? targetSubId : undefined,
        status: SubscriptionStatus.ACTIVE,
        isPaused: false,
        nextInvoiceDate: { lte: targetDate },
      },
      include: {
        plan: true,
        customer: true,
        lines: {
          include: {
            product: { include: { variants: true } },
            variant: true,
            taxRule: true,
          },
        },
      },
      orderBy: { nextInvoiceDate: 'asc' },
    });

    const evaluatedCount = dueSubscriptions.length;
    logger.info(`⚡ [BILLING] Executing cycle: ${evaluatedCount} due subscription(s) found (Target date: ${targetDate.toISOString().slice(0, 10)})`);

    for (const sub of dueSubscriptions) {
      try {
        await prisma.$transaction(
          async (tx) => {
            let currentNextInvoiceDate = new Date(sub.nextInvoiceDate);

            // Fetch active tax rules for lookup
            const taxRules = await tx.taxRule.findMany({
              where: { isActive: true },
              orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            });

            // Catch-up loop: generate invoices for all elapsed billing periods
            while (
              currentNextInvoiceDate <= targetDate &&
              currentNextInvoiceDate <= sub.expiryDate
            ) {
              const periodStart = new Date(currentNextInvoiceDate);
              const { end: periodEnd, nextStart } = this.calculateNextPeriod(
                periodStart,
                sub.plan.billingPeriod
              );

              // 1. Idempotency Check: (subscriptionId, periodStart)
              const existingInvoice = await tx.invoice.findUnique({
                where: {
                  subscriptionId_periodStart: {
                    subscriptionId: sub.id,
                    periodStart,
                  },
                },
              });

              if (existingInvoice) {
                skippedCount++;
                currentNextInvoiceDate = nextStart;
                continue;
              }

              // 2. Build invoice lines snapshot
              let subtotal = 0;
              const preparedLines: Array<{
                description: string;
                quantity: number;
                unitPrice: number;
                amount: number;
                productType: string;
                productId: string;
                taxId: string | null;
              }> = [];

              for (const line of sub.lines) {
                const desc = line.variant
                  ? `${line.product.name} (${line.variant.attribute}: ${line.variant.value})`
                  : line.product.name;
                const lineAmount = line.unitPrice * line.quantity;
                subtotal += lineAmount;

                preparedLines.push({
                  description: desc,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  amount: lineAmount,
                  productType: line.product.type,
                  productId: line.productId,
                  taxId: line.taxId,
                });
              }

              // 3. Discount Evaluation (PRD §8.3)
              // Fetch candidate discounts active for this period
              const candidateDiscounts = await tx.discount.findMany({
                where: {
                  isActive: true,
                  startDate: { lte: periodStart },
                  endDate: { gte: periodStart },
                },
                include: {
                  products: true,
                  subscriptions: true,
                },
              });

              let totalDiscount = 0;
              const appliedDiscounts: Array<{ discountId: string; amount: number }> = [];

              // Product-level best discounts
              const lineDiscounts: number[] = preparedLines.map(() => 0);

              for (let i = 0; i < preparedLines.length; i++) {
                const line = preparedLines[i];
                const matchingProductDiscounts = candidateDiscounts.filter((d) => {
                  if (d.scope !== 'PRODUCT') return false;
                  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
                  if (d.minQuantity !== null && line.quantity < d.minQuantity) return false;
                  if (d.minPurchase !== null && line.amount < d.minPurchase) return false;
                  return d.products.some((p) => p.productId === line.productId);
                });

                let bestLineDiscount = 0;
                let bestDiscountId: string | null = null;

                for (const d of matchingProductDiscounts) {
                  let discountVal = 0;
                  if (d.kind === DiscountKind.FIXED) {
                    discountVal = Math.min(d.value, line.amount);
                  } else {
                    discountVal = Math.round((line.amount * d.value) / 100);
                  }

                  if (discountVal > bestLineDiscount) {
                    bestLineDiscount = discountVal;
                    bestDiscountId = d.id;
                  }
                }

                if (bestLineDiscount > 0 && bestDiscountId) {
                  lineDiscounts[i] = bestLineDiscount;
                  totalDiscount += bestLineDiscount;
                  appliedDiscounts.push({ discountId: bestDiscountId, amount: bestLineDiscount });
                }
              }

              // Subscription-level best discount
              const remainingSubtotal = Math.max(0, subtotal - totalDiscount);
              const matchingSubDiscounts = candidateDiscounts.filter((d) => {
                if (d.scope !== 'SUBSCRIPTION') return false;
                if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
                if (d.minPurchase !== null && subtotal < d.minPurchase) return false;
                // If specific subscriptions listed, check inclusion; if empty, applies to all
                if (d.subscriptions.length > 0) {
                  return d.subscriptions.some((s) => s.subscriptionId === sub.id);
                }
                return true;
              });

              let bestSubDiscount = 0;
              let bestSubDiscountId: string | null = null;

              for (const d of matchingSubDiscounts) {
                let discountVal = 0;
                if (d.kind === DiscountKind.FIXED) {
                  discountVal = Math.min(d.value, remainingSubtotal);
                } else {
                  discountVal = Math.round((remainingSubtotal * d.value) / 100);
                }

                if (discountVal > bestSubDiscount) {
                  bestSubDiscount = discountVal;
                  bestSubDiscountId = d.id;
                }
              }

              if (bestSubDiscount > 0 && bestSubDiscountId) {
                totalDiscount += bestSubDiscount;
                appliedDiscounts.push({ discountId: bestSubDiscountId, amount: bestSubDiscount });
              }

              // Clamp total discount to subtotal
              totalDiscount = Math.min(totalDiscount, subtotal);

              // 4. Concurrently safe atomic usage increment for applied discounts
              for (const app of appliedDiscounts) {
                // Update usedCount atomically where usedCount < usageLimit or usageLimit IS NULL
                const updateRes = await tx.$executeRaw`
                  UPDATE "Discount"
                  SET "usedCount" = "usedCount" + 1
                  WHERE "id" = ${app.discountId}
                  AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
                `;

                if (updateRes === 0) {
                  // Concurrently exhausted, rollback or omit discount
                  logger.warn(
                    { discountId: app.discountId, subId: sub.id },
                    'Discount reached usage limit during invoice execution'
                  );
                }
              }

              // 5. Tax Calculation (PRD §8.4)
              let totalTax = 0;
              const finalInvoiceLines = preparedLines.map((line, idx) => {
                const lineDisc = lineDiscounts[idx] || 0;
                const taxableBase = Math.max(0, line.amount - lineDisc);

                // Priority: rule matching productType -> rule with null productType -> line.taxId
                let chosenTax: { name: string; ratePercent: number } | null = null;

                const typeRule = taxRules.find((t) => t.productType === line.productType);
                if (typeRule) {
                  chosenTax = { name: typeRule.name, ratePercent: typeRule.ratePercent };
                } else {
                  const genericRule = taxRules.find((t) => !t.productType);
                  if (genericRule) {
                    chosenTax = { name: genericRule.name, ratePercent: genericRule.ratePercent };
                  } else if (line.taxId) {
                    const explicit = taxRules.find((t) => t.id === line.taxId);
                    if (explicit) {
                      chosenTax = { name: explicit.name, ratePercent: explicit.ratePercent };
                    }
                  }
                }

                let lineTaxAmount = 0;
                if (chosenTax) {
                  lineTaxAmount = Math.round((taxableBase * chosenTax.ratePercent) / 100);
                }
                totalTax += lineTaxAmount;

                return {
                  description: line.description,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  discountAmount: lineDisc,
                  taxName: chosenTax?.name || null,
                  taxRate: chosenTax?.ratePercent || null,
                  taxAmount: lineTaxAmount,
                  amount: line.amount,
                };
              });

              const totalAmount = Math.max(0, subtotal - totalDiscount + totalTax);
              const invoiceNumber = await this.getNextInvoiceNumber();
              const issueDate = new Date();
              const dueDate = this.calculateDueDate(issueDate, sub.paymentTerms);

              // 6. Insert Invoice & Snapshot Lines
              await tx.invoice.create({
                data: {
                  number: invoiceNumber,
                  subscriptionId: sub.id,
                  customerId: sub.customerId,
                  periodStart,
                  periodEnd,
                  status: InvoiceStatus.DRAFT,
                  issueDate,
                  dueDate,
                  subtotal,
                  discountTotal: totalDiscount,
                  taxTotal: totalTax,
                  total: totalAmount,
                  amountPaid: 0,
                  lines: {
                    create: finalInvoiceLines,
                  },
                  discountUses: {
                    create: appliedDiscounts.map((d) => ({
                      discountId: d.discountId,
                      amount: d.amount,
                    })),
                  },
                },
              });

              createdCount++;
              currentNextInvoiceDate = nextStart;
            }

            // 7. Update subscription nextInvoiceDate
            const updateSubData: { nextInvoiceDate: Date; status?: SubscriptionStatus } = {
              nextInvoiceDate: currentNextInvoiceDate,
            };

            // Check autoClose rule (PRD §8.2)
            if (sub.plan.autoClose && currentNextInvoiceDate > sub.expiryDate) {
              updateSubData.status = SubscriptionStatus.CLOSED;
            }

            await tx.subscription.update({
              where: { id: sub.id },
              data: updateSubData,
            });
          },
          { maxWait: 10000, timeout: 35000 }
        );
      } catch (err: unknown) {
        failedCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push({ subscriptionId: sub.id, error: errMsg });
        logger.error({ subId: sub.id, err }, 'Failed billing cycle for subscription');
      }
    }

    const finalStatus = failedCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';

    await prisma.billingRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        subscriptionsEvaluated: evaluatedCount,
        invoicesCreated: createdCount,
        skippedCount,
        failedCount,
        details: { errors },
      },
    });

    logger.info(`✅ [BILLING] Cycle complete: ${createdCount} created, ${skippedCount} skipped (idempotent), ${failedCount} failed`);

    return {
      runId: run.id,
      evaluated: evaluatedCount,
      created: createdCount,
      skipped: skippedCount,
      failed: failedCount,
      errors,
    };
  }

  static async listInvoices(query: {
    page?: number;
    pageSize?: number;
    customerId?: string;
    subscriptionId?: string;
    status?: InvoiceStatus;
    q?: string;
  }) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 25, 100);
    const skip = (page - 1) * pageSize;

    const where: {
      customerId?: string;
      subscriptionId?: string;
      status?: InvoiceStatus;
      OR?: Array<{ number?: { contains: string; mode: 'insensitive' }; customer?: { name?: { contains: string; mode: 'insensitive' } } }>;
    } = {};

    if (query.customerId) where.customerId = query.customerId;
    if (query.subscriptionId) where.subscriptionId = query.subscriptionId;
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { number: { contains: query.q, mode: 'insensitive' } },
        { customer: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          subscription: { include: { plan: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async getInvoice(id: string, customerId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
        lines: true,
        payments: {
          include: { recordedBy: { select: { id: true, email: true } } },
          orderBy: { paidAt: 'desc' },
        },
        discountUses: { include: { discount: true } },
      },
    });

    if (!invoice) throw AppError.notFound('Invoice not found');

    if (customerId && invoice.customerId !== customerId) {
      throw AppError.notFound('Invoice not found');
    }

    return invoice;
  }

  static async confirmInvoice(id: string, actorId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw AppError.notFound('Invoice not found');

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw AppError.invalidTransition(
        `Cannot confirm invoice in ${invoice.status} status`,
        ['DRAFT']
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CONFIRMED },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CONFIRM_INVOICE',
          entity: 'Invoice',
          entityId: id,
        },
      });

      return updated;
    }, { maxWait: 10000, timeout: 30000 });
  }

  static async cancelInvoice(id: string, actorId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { discountUses: true },
    });
    if (!invoice) throw AppError.notFound('Invoice not found');

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      throw AppError.badRequest(`Cannot cancel an invoice with status ${invoice.status}`);
    }

    if (invoice.amountPaid > 0) {
      throw AppError.badRequest('Cannot cancel an invoice that has payments recorded');
    }

    return prisma.$transaction(async (tx) => {
      // Revert discount usage count if any
      for (const du of invoice.discountUses) {
        await tx.discount.update({
          where: { id: du.discountId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CANCELLED },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CANCEL_INVOICE',
          entity: 'Invoice',
          entityId: id,
        },
      });

      return updated;
    }, { maxWait: 10000, timeout: 30000 });
  }

  static async sendInvoice(id: string) {
    const invoice = await this.getInvoice(id);

    const formattedTotal = (invoice.total / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });

    const linesHtml = invoice.lines
      .map(
        (l) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${l.description}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${l.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">₹${(l.unitPrice / 100).toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">₹${(l.amount / 100).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:640px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#4F46E5;margin-bottom:8px">Brightloop Invoice: ${invoice.number}</h2>
        <p>Dear ${invoice.customer.name},</p>
        <p>Please find details of your subscription invoice below:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px;text-align:left">Description</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Unit Price</th>
              <th style="padding:8px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>
        <div style="text-align:right;margin-top:16px">
          <p><strong>Subtotal:</strong> ₹${(invoice.subtotal / 100).toFixed(2)}</p>
          <p><strong>Discount:</strong> -₹${(invoice.discountTotal / 100).toFixed(2)}</p>
          <p><strong>Tax:</strong> ₹${(invoice.taxTotal / 100).toFixed(2)}</p>
          <p style="font-size:18px;color:#1e293b"><strong>Total Due:</strong> ${formattedTotal}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#64748b">Thank you for your business with Brightloop.</p>
      </div>
    `;

    await sendEmail({
      to: invoice.customer.email,
      subject: `Brightloop Invoice ${invoice.number}`,
      html,
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    return { success: true, sentAt: updated.sentAt };
  }
}

