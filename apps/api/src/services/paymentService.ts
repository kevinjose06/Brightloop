import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class PaymentService {
  static async recordPayment(data: {
    invoiceId: string;
    method: PaymentMethod;
    amount: number; // in paise
    paidAt?: Date;
    note?: string;
    actorId: string;
    idempotencyKey?: string;
  }) {
    if (data.amount <= 0) {
      throw AppError.badRequest('Payment amount must be greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      // Find invoice with status check
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) {
        throw AppError.notFound('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.DRAFT) {
        throw AppError.badRequest('Invoice must be Confirmed before recording payments');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw AppError.badRequest('Cannot record payments against a Cancelled invoice');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw AppError.badRequest('Invoice is already fully paid');
      }

      const remainingBalance = invoice.total - invoice.amountPaid;

      if (data.amount > remainingBalance) {
        throw AppError.overpayment(
          `Payment amount of ₹${(data.amount / 100).toFixed(2)} exceeds remaining balance of ₹${(remainingBalance / 100).toFixed(2)}`
        );
      }

      const newAmountPaid = invoice.amountPaid + data.amount;
      const nextStatus =
        newAmountPaid >= invoice.total ? InvoiceStatus.PAID : InvoiceStatus.CONFIRMED;

      const payment = await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          method: data.method,
          amount: data.amount,
          paidAt: data.paidAt || new Date(),
          note: data.note,
          recordedById: data.actorId,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          status: nextStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: data.actorId,
          action: 'RECORD_PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          meta: {
            invoiceId: invoice.id,
            amount: data.amount,
            method: data.method,
            newStatus: nextStatus,
          },
        },
      });

      logger.info(
        `💰 [PAYMENT] ₹${(data.amount / 100).toFixed(2)} recorded for ${invoice.number} via ${data.method} ➔ Status: ${nextStatus}`
      );

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  static async listPayments(query: { invoiceId?: string; customerId?: string }) {
    const where: { invoiceId?: string; invoice?: { customerId?: string } } = {};
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.customerId) where.invoice = { customerId: query.customerId };

    return prisma.payment.findMany({
      where,
      include: {
        invoice: { select: { number: true, total: true, status: true, customerId: true } },
        recordedBy: { select: { id: true, email: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
  }
}

