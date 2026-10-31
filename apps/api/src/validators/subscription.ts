import { z } from 'zod';
import { SubscriptionStatus, PaymentTerms } from '@prisma/client';

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid('Valid customer UUID required'),
  planId: z.string().uuid('Valid plan UUID required'),
  templateId: z.string().uuid().optional().nullable(),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  expiryDate: z.string().or(z.date()).transform((val) => new Date(val)),
  paymentTerms: z.nativeEnum(PaymentTerms).default(PaymentTerms.IMMEDIATE),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        taxId: z.string().uuid().optional().nullable(),
      })
    )
    .min(1, 'At least one line item is required')
    .optional(), // Can be omitted if templateId is provided
});

export const updateSubscriptionSchema = z.object({
  paymentTerms: z.nativeEnum(PaymentTerms).optional(),
  expiryDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().min(1),
        taxId: z.string().uuid().optional().nullable(),
      })
    )
    .optional(),
});

export const transitionSubscriptionSchema = z.object({
  to: z.nativeEnum(SubscriptionStatus),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  q: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  planId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

