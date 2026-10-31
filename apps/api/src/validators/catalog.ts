import { z } from 'zod';
import { ProductType, BillingPeriod, DiscountKind, DiscountScope } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.nativeEnum(ProductType).default(ProductType.SOFTWARE),
  salesPrice: z.number().int().min(0, 'Sales price must be positive in paise'),
  costPrice: z.number().int().min(0, 'Cost price must be positive in paise'),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  variants: z
    .array(
      z.object({
        attribute: z.string().min(1),
        value: z.string().min(1),
        extraPrice: z.number().int().default(0),
      })
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  attribute: z.string().min(1, 'Attribute name is required (e.g. Brand)'),
  value: z.string().min(1, 'Value is required (e.g. Odoo)'),
  extraPrice: z.number().int().default(0), // in paise
});

export const updateVariantSchema = createVariantSchema.partial();

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  price: z.number().int().min(0, 'Base price must be positive in paise'),
  billingPeriod: z.nativeEnum(BillingPeriod).default(BillingPeriod.MONTHLY),
  minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
  availableFrom: z.string().or(z.date()).transform((val) => new Date(val)),
  availableTo: z.string().or(z.date()).transform((val) => new Date(val)),
  autoClose: z.boolean().default(false),
  allowEarlyClose: z.boolean().default(false),
  allowPause: z.boolean().default(false),
  allowRenew: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const createTaxRuleSchema = z.object({
  name: z.string().min(1, 'Tax rule name is required'),
  ratePercent: z.number().min(0, 'Tax rate must be positive'),
  productType: z.nativeEnum(ProductType).optional().nullable(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateTaxRuleSchema = createTaxRuleSchema.partial();

export const createDiscountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  kind: z.nativeEnum(DiscountKind).default(DiscountKind.PERCENT),
  value: z.number().int().min(1, 'Discount value must be greater than 0'),
  minPurchase: z.number().int().optional().nullable(), // paise
  minQuantity: z.number().int().optional().nullable(),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  usageLimit: z.number().int().positive().optional().nullable(),
  scope: z.nativeEnum(DiscountScope).default(DiscountScope.SUBSCRIPTION),
  productIds: z.array(z.string()).optional(),
  subscriptionIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  validityDays: z.number().int().min(1).default(30),
  planId: z.string().uuid('Valid plan UUID is required'),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .min(1, 'At least one line item is required'),
});

export const updateTemplateSchema = createTemplateSchema.partial();

