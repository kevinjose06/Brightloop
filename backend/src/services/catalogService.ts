import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import {
  ProductType,
  BillingPeriod,
  DiscountKind,
  DiscountScope,
  Prisma,
} from '@prisma/client';

export class CatalogService {
  // PRODUCTS
  static async listProducts(query: { q?: string; type?: ProductType; isActive?: boolean }) {
    const where: Prisma.ProductWhereInput = {};
    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!product) throw AppError.notFound('Product not found');
    return product;
  }

  static async createProduct(data: {
    name: string;
    type?: ProductType;
    salesPrice: number;
    costPrice: number;
    notes?: string;
    isActive?: boolean;
    variants?: Array<{ attribute: string; value: string; extraPrice: number }>;
  }) {
    return prisma.product.create({
      data: {
        name: data.name,
        type: data.type || ProductType.SOFTWARE,
        salesPrice: data.salesPrice,
        costPrice: data.costPrice,
        notes: data.notes,
        isActive: data.isActive ?? true,
        variants: data.variants
          ? {
              create: data.variants.map((v) => ({
                attribute: v.attribute,
                value: v.value,
                extraPrice: v.extraPrice,
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
  }

  static async updateProduct(
    id: string,
    data: {
      name?: string;
      type?: ProductType;
      salesPrice?: number;
      costPrice?: number;
      notes?: string;
      isActive?: boolean;
      variants?: Array<{ attribute: string; value: string; extraPrice: number }>;
    }
  ) {
    await this.getProduct(id);
    const { variants, ...productData } = data;
    return prisma.product.update({
      where: { id },
      data: productData,
      include: { variants: true },
    });
  }

  static async deleteProduct(id: string) {
    await this.getProduct(id);
    return prisma.product.delete({ where: { id } });
  }

  // VARIANTS
  static async addVariant(
    productId: string,
    data: { attribute: string; value: string; extraPrice: number }
  ) {
    await this.getProduct(productId);
    return prisma.productVariant.create({
      data: {
        productId,
        attribute: data.attribute,
        value: data.value,
        extraPrice: data.extraPrice,
      },
    });
  }

  static async updateVariant(
    id: string,
    data: { attribute?: string; value?: string; extraPrice?: number }
  ) {
    return prisma.productVariant.update({
      where: { id },
      data,
    });
  }

  static async deleteVariant(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  }

  // PLANS
  static async listPlans(query: { isActive?: boolean; billingPeriod?: BillingPeriod }) {
    const where: Prisma.PlanWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.billingPeriod) where.billingPeriod = query.billingPeriod;

    return prisma.plan.findMany({
      where,
      orderBy: { price: 'asc' },
    });
  }

  static async getPlan(id: string) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw AppError.notFound('Plan not found');
    return plan;
  }

  static async createPlan(data: {
    name: string;
    price: number;
    billingPeriod: BillingPeriod;
    minQuantity?: number;
    availableFrom: Date;
    availableTo: Date;
    autoClose?: boolean;
    allowEarlyClose?: boolean;
    allowPause?: boolean;
    allowRenew?: boolean;
    isActive?: boolean;
  }) {
    return prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        billingPeriod: data.billingPeriod,
        minQuantity: data.minQuantity ?? 1,
        availableFrom: data.availableFrom,
        availableTo: data.availableTo,
        autoClose: data.autoClose ?? false,
        allowEarlyClose: data.allowEarlyClose ?? false,
        allowPause: data.allowPause ?? false,
        allowRenew: data.allowRenew ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updatePlan(id: string, data: Prisma.PlanUpdateInput) {
    await this.getPlan(id);
    return prisma.plan.update({
      where: { id },
      data,
    });
  }

  // TAX RULES
  static async listTaxes(isActive?: boolean) {
    const where: Prisma.TaxRuleWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.taxRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async createTaxRule(data: {
    name: string;
    ratePercent: number;
    productType?: ProductType | null;
    priority?: number;
    isActive?: boolean;
  }) {
    return prisma.taxRule.create({
      data: {
        name: data.name,
        ratePercent: data.ratePercent,
        productType: data.productType,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateTaxRule(id: string, data: Prisma.TaxRuleUpdateInput) {
    return prisma.taxRule.update({
      where: { id },
      data,
    });
  }

  // DISCOUNTS
  static async listDiscounts(query: { isActive?: boolean; scope?: DiscountScope }) {
    const where: Prisma.DiscountWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.scope) where.scope = query.scope;

    return prisma.discount.findMany({
      where,
      include: {
        products: { include: { product: true } },
        subscriptions: { include: { subscription: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createDiscount(
    actorId: string,
    data: {
      name: string;
      kind: DiscountKind;
      value: number;
      minPurchase?: number | null;
      minQuantity?: number | null;
      startDate: Date;
      endDate: Date;
      usageLimit?: number | null;
      scope: DiscountScope;
      productIds?: string[];
      subscriptionIds?: string[];
      isActive?: boolean;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: data.name,
          kind: data.kind,
          value: data.value,
          minPurchase: data.minPurchase,
          minQuantity: data.minQuantity,
          startDate: data.startDate,
          endDate: data.endDate,
          usageLimit: data.usageLimit,
          scope: data.scope,
          isActive: data.isActive ?? true,
          products:
            data.scope === 'PRODUCT' && data.productIds && data.productIds.length > 0
              ? {
                  create: data.productIds.map((pId) => ({ productId: pId })),
                }
              : undefined,
          subscriptions:
            data.scope === 'SUBSCRIPTION' && data.subscriptionIds && data.subscriptionIds.length > 0
              ? {
                  create: data.subscriptionIds.map((sId) => ({ subscriptionId: sId })),
                }
              : undefined,
        },
        include: {
          products: { include: { product: true } },
          subscriptions: { include: { subscription: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CREATE_DISCOUNT',
          entity: 'Discount',
          entityId: discount.id,
          meta: { name: discount.name, kind: discount.kind, value: discount.value },
        },
      });

      return discount;
    });
  }

  static async updateDiscount(
    actorId: string,
    id: string,
    data: Prisma.DiscountUpdateInput
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.discount.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE_DISCOUNT',
          entity: 'Discount',
          entityId: id,
          meta: { changes: Object.keys(data) },
        },
      });

      return updated;
    });
  }

  // TEMPLATES
  static async listTemplates() {
    return prisma.quotationTemplate.findMany({
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTemplate(id: string) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    if (!template) throw AppError.notFound('Quotation template not found');
    return template;
  }

  static async createTemplate(data: {
    name: string;
    validityDays: number;
    planId: string;
    lines: Array<{ productId: string; variantId?: string | null; quantity: number }>;
  }) {
    return prisma.quotationTemplate.create({
      data: {
        name: data.name,
        validityDays: data.validityDays,
        planId: data.planId,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId || null,
            quantity: l.quantity,
          })),
        },
      },
      include: {
        plan: true,
        lines: {
          include: { product: true, variant: true },
        },
      },
    });
  }

  // CUSTOMERS
  static async listCustomers(q?: string) {
    const where: Prisma.CustomerWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.customer.findMany({
      where,
      include: {
        subscriptions: { select: { id: true, status: true, number: true } },
        invoices: { select: { id: true, status: true, total: true, amountPaid: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { plan: true } },
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) throw AppError.notFound('Customer not found');
    return customer;
  }

  static async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    taxId?: string;
  }) {
    return prisma.customer.create({
      data,
    });
  }

  static async updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
    await this.getCustomer(id);
    return prisma.customer.update({
      where: { id },
      data,
    });
  }
}

