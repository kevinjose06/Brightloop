import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const createPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  amount: z.number().int().positive('Payment amount must be greater than zero (in paise)'),
  paidAt: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
  note: z.string().optional(),
});

export const runBillingSchema = z.object({
  targetDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
  subscriptionId: z.string().uuid().optional(),
});

