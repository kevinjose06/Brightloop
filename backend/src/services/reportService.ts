import { prisma } from '../lib/prisma.js';
import { InvoiceStatus, SubscriptionStatus, BillingPeriod } from '@prisma/client';
import { differenceInDays } from 'date-fns';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const summaryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds as specified in PRD §13

export class ReportService {
  static async getSummary(params: {
    from?: string;
    to?: string;
    customerId?: string;
    planId?: string;
  }) {
    const cacheKey = JSON.stringify(params);
    const cached = summaryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const today = new Date();
    const fromDate = params.from ? new Date(params.from) : undefined;
    const toDate = params.to ? new Date(params.to) : undefined;

    // 1. Active Subscriptions Count & MRR Calculation
    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        customerId: params.customerId || undefined,
        planId: params.planId || undefined,
      },
      select: {
        plan: {
          select: {
            billingPeriod: true,
          },
        },
        lines: {
          select: {
            amount: true,
          },
        },
      },
    });

    const activeSubscriptionsCount = activeSubs.length;

    let mrrInPaise = 0;
    for (const sub of activeSubs) {
      const recurringTotal = sub.lines.reduce((acc, l) => acc + l.amount, 0);
      switch (sub.plan.billingPeriod) {
        case BillingPeriod.DAILY:
          mrrInPaise += recurringTotal * 30;
          break;
        case BillingPeriod.WEEKLY:
          mrrInPaise += Math.round((recurringTotal * 52) / 12);
          break;
        case BillingPeriod.MONTHLY:
          mrrInPaise += recurringTotal;
          break;
        case BillingPeriod.YEARLY:
          mrrInPaise += Math.round(recurringTotal / 12);
          break;
      }
    }

    // 2. Revenue collected (sum of payments in date range)
    const paymentWhere: {
      paidAt?: { gte?: Date; lte?: Date };
      invoice?: { customerId?: string; subscription?: { planId?: string } };
    } = {};

    if (fromDate || toDate) {
      paymentWhere.paidAt = {};
      if (fromDate) paymentWhere.paidAt.gte = fromDate;
      if (toDate) paymentWhere.paidAt.lte = toDate;
    }
    if (params.customerId || params.planId) {
      paymentWhere.invoice = {};
      if (params.customerId) paymentWhere.invoice.customerId = params.customerId;
      if (params.planId) paymentWhere.invoice.subscription = { planId: params.planId };
    }

    const revenueAggregate = await prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
    });
    const revenueCollected = revenueAggregate._sum.amount || 0;

    // 3. Billed amount (sum of non-cancelled invoice totals)
    const invoiceWhere: {
      status?: { not: InvoiceStatus };
      issueDate?: { gte?: Date; lte?: Date };
      customerId?: string;
      subscription?: { planId?: string };
    } = {
      status: { not: InvoiceStatus.CANCELLED },
    };

    if (fromDate || toDate) {
      invoiceWhere.issueDate = {};
      if (fromDate) invoiceWhere.issueDate.gte = fromDate;
      if (toDate) invoiceWhere.issueDate.lte = toDate;
    }
    if (params.customerId) invoiceWhere.customerId = params.customerId;
    if (params.planId) invoiceWhere.subscription = { planId: params.planId };

    const billedAggregate = await prisma.invoice.aggregate({
      where: invoiceWhere,
      _sum: { total: true },
    });
    const billedTotal = billedAggregate._sum.total || 0;

    // 4. Outstanding (Confirmed invoices balance: total - amountPaid)
    const confirmedInvoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        customerId: params.customerId || undefined,
        subscription: params.planId ? { planId: params.planId } : undefined,
      },
      select: {
        total: true,
        amountPaid: true,
        dueDate: true,
      },
    });

    let outstandingTotal = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const inv of confirmedInvoices) {
      const balance = Math.max(0, inv.total - inv.amountPaid);
      outstandingTotal += balance;

      if (inv.dueDate < today && balance > 0) {
        overdueCount++;
        overdueAmount += balance;
      }
    }

    const result = {
      activeSubscriptions: activeSubscriptionsCount,
      mrr: mrrInPaise,
      revenueCollected,
      billedTotal,
      outstandingTotal,
      overdueCount,
      overdueAmount,
      cachedAt: new Date(),
    };

    summaryCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  }

  static async getOverdueInvoices(params: { customerId?: string }) {
    const today = new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: today },
        customerId: params.customerId || undefined,
      },
      include: {
        customer: true,
        subscription: { include: { plan: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return invoices
      .map((inv) => {
        const balance = inv.total - inv.amountPaid;
        const daysOverdue = differenceInDays(today, inv.dueDate);
        return {
          ...inv,
          balance,
          daysOverdue,
        };
      })
      .filter((inv) => inv.balance > 0);
  }

  static async getRevenueSeries(params: { months?: number }) {
    const monthsCount = params.months || 6;
    const now = new Date();
    const series: Array<{ month: string; revenue: number; billed: number }> = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = start.toLocaleString('default', { month: 'short' });

      const [payments, invoices] = await Promise.all([
        prisma.payment.aggregate({
          where: { paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.invoice.aggregate({
          where: {
            issueDate: { gte: start, lte: end },
            status: { not: InvoiceStatus.CANCELLED },
          },
          _sum: { total: true },
        }),
      ]);

      series.push({
        month: monthLabel,
        revenue: payments._sum.amount || 0,
        billed: invoices._sum.total || 0,
      });
    }

    return series;
  }
}

