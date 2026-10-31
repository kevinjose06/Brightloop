import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { SubscriptionStatus, PaymentTerms, Prisma, BillingPeriod } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export class SubscriptionService {
  private static async getNextSubscriptionNumber(): Promise<string> {
    const count = await prisma.subscription.count();
    return `SUB-${String(count + 1).padStart(6, '0')}`;
  }

  static async listSubscriptions(query: {
    page?: number;
    pageSize?: number;
    customerId?: string;
    status?: SubscriptionStatus;
    planId?: string;
    q?: string;
  }) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 25, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.SubscriptionWhereInput = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;
    if (query.planId) where.planId = query.planId;
    if (query.q) {
      where.OR = [
        { number: { contains: query.q, mode: 'insensitive' } },
        { customer: { name: { contains: query.q, mode: 'insensitive' } } },
        { customer: { company: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          plan: true,
          lines: {
            include: { product: true, variant: true, taxRule: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
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

  static async getSubscription(id: string, customerId?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        template: true,
        lines: {
          include: { product: true, variant: true, taxRule: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) throw AppError.notFound('Subscription not found');

    // Anti-IDOR check for customer portal
    if (customerId && subscription.customerId !== customerId) {
      throw AppError.notFound('Subscription not found');
    }

    return subscription;
  }

  static async createSubscription(
    actorId: string,
    data: {
      customerId: string;
      planId: string;
      templateId?: string | null;
      startDate: Date;
      expiryDate: Date;
      paymentTerms?: PaymentTerms;
      lines?: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        taxId?: string | null;
      }>;
    }
  ) {
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan || !plan.isActive) {
      throw AppError.planUnavailable('Plan is not available or inactive');
    }

    // Availability dates validation
    const now = new Date();
    if (data.startDate < plan.availableFrom || data.startDate > plan.availableTo) {
      throw AppError.planUnavailable(
        `Plan is only available between ${plan.availableFrom.toISOString().slice(0, 10)} and ${plan.availableTo.toISOString().slice(0, 10)}`
      );
    }

    let inputLines = data.lines || [];

    // If template specified and no explicit lines, copy lines from template
    if (data.templateId && inputLines.length === 0) {
      const template = await prisma.quotationTemplate.findUnique({
        where: { id: data.templateId },
        include: { lines: true },
      });
      if (template) {
        inputLines = template.lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
          taxId: null,
        }));
      }
    }

    if (inputLines.length === 0) {
      throw AppError.badRequest('Subscription must contain at least one line item');
    }

    // Resolve products, variants, effective prices
    const resolvedLines: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number;
      amount: number;
      taxId?: string | null;
    }> = [];

    for (const item of inputLines) {
      if (item.quantity < plan.minQuantity) {
        throw AppError.belowMinQuantity(
          `Line item quantity (${item.quantity}) is below plan minimum quantity requirement of ${plan.minQuantity}`
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isActive) {
        throw AppError.badRequest(`Product ${item.productId} is inactive or does not exist`);
      }

      let variantExtra = 0;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) throw AppError.badRequest(`Product variant ${item.variantId} not found`);
        variantExtra = variant.extraPrice;
      }

      const unitPrice = product.salesPrice + variantExtra;
      const amount = unitPrice * item.quantity;

      resolvedLines.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice,
        amount,
        taxId: item.taxId || null,
      });
    }

    const number = await this.getNextSubscriptionNumber();

    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          number,
          customerId: data.customerId,
          planId: data.planId,
          templateId: data.templateId || null,
          status: SubscriptionStatus.DRAFT,
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          nextInvoiceDate: data.startDate,
          paymentTerms: data.paymentTerms || PaymentTerms.IMMEDIATE,
          createdById: actorId,
          lines: {
            create: resolvedLines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              amount: l.amount,
              taxId: l.taxId,
            })),
          },
        },
        include: {
          customer: true,
          plan: true,
          lines: { include: { product: true, variant: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CREATE_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: subscription.id,
          meta: { number: subscription.number, customerId: subscription.customerId },
        },
      });

      logger.info(`📄 [SUBSCRIPTION] Created ${subscription.number} for ${subscription.customer.name} (Plan: ${subscription.plan.name})`);

      return subscription;
    });
  }

  static async transition(
    id: string,
    targetState: SubscriptionStatus,
    actorId: string,
    customerScopeId?: string
  ) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw AppError.notFound('Subscription not found');

    if (customerScopeId && sub.customerId !== customerScopeId) {
      throw AppError.notFound('Subscription not found');
    }

    const current = sub.status;

    // Define valid transitions:
    // DRAFT -> QUOTATION
    // QUOTATION -> CONFIRMED
    // CONFIRMED -> ACTIVE
    // ACTIVE -> CLOSED
    const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
      DRAFT: [SubscriptionStatus.QUOTATION, SubscriptionStatus.CLOSED],
      QUOTATION: [SubscriptionStatus.CONFIRMED, SubscriptionStatus.CLOSED],
      CONFIRMED: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED],
      ACTIVE: [SubscriptionStatus.CLOSED],
      CLOSED: [],
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(targetState)) {
      throw AppError.invalidTransition(
        `Cannot transition subscription from ${current} to ${targetState}`,
        allowed
      );
    }

    // Customer specific permissions
    if (customerScopeId && targetState === SubscriptionStatus.CLOSED && !sub.plan.allowEarlyClose) {
      throw AppError.forbidden('Plan does not allow early close by customer');
    }

    const updateData: Prisma.SubscriptionUpdateInput = {
      status: targetState,
    };

    // Quotation validity rule
    if (targetState === SubscriptionStatus.QUOTATION) {
      const template = sub.templateId
        ? await prisma.quotationTemplate.findUnique({ where: { id: sub.templateId } })
        : null;
      const validityDays = template?.validityDays || 30;
      updateData.quotationValidUntil = addDays(new Date(), validityDays);
    }

    // Activation rule: nextInvoiceDate = startDate
    if (targetState === SubscriptionStatus.ACTIVE) {
      updateData.nextInvoiceDate = sub.startDate;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: updateData,
        include: { plan: true, customer: true, lines: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'TRANSITION_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: id,
          meta: { from: current, to: targetState },
        },
      });

      logger.info(`🔄 [SUBSCRIPTION] ${sub.number} transitioned: ${current} ➔ ${targetState}`);

      return updated;
    });
  }

  static async togglePause(id: string, actorId: string, customerScopeId?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw AppError.notFound('Subscription not found');
    if (customerScopeId && sub.customerId !== customerScopeId) {
      throw AppError.notFound('Subscription not found');
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw AppError.badRequest('Only active subscriptions can be paused or resumed');
    }

    if (!sub.plan.allowPause) {
      throw AppError.forbidden('The plan for this subscription does not allow pausing');
    }

    const nextPauseState = !sub.isPaused;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: { isPaused: nextPauseState },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: nextPauseState ? 'PAUSE_SUBSCRIPTION' : 'RESUME_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: id,
        },
      });

      return updated;
    });
  }

  static async renew(id: string, actorId: string, customerScopeId?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw AppError.notFound('Subscription not found');
    if (customerScopeId && sub.customerId !== customerScopeId) {
      throw AppError.notFound('Subscription not found');
    }

    if (!sub.plan.allowRenew) {
      throw AppError.forbidden('The plan for this subscription does not allow renewal');
    }

    // Extend expiry by plan period
    let newExpiry = new Date(sub.expiryDate);
    switch (sub.plan.billingPeriod) {
      case BillingPeriod.DAILY:
        newExpiry = addDays(newExpiry, 1);
        break;
      case BillingPeriod.WEEKLY:
        newExpiry = addWeeks(newExpiry, 1);
        break;
      case BillingPeriod.MONTHLY:
        newExpiry = addMonths(newExpiry, 1);
        break;
      case BillingPeriod.YEARLY:
        newExpiry = addYears(newExpiry, 1);
        break;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: {
          expiryDate: newExpiry,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'RENEW_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: id,
          meta: { oldExpiry: sub.expiryDate, newExpiry },
        },
      });

      return updated;
    });
  }
}

