import { PrismaClient, Role, ProductType, BillingPeriod, SubscriptionStatus, PaymentTerms, InvoiceStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Starting high-scale benchmark seed (5,000 subscriptions, 20,000 invoices, 15,000 payments)...');

  // Fetch or create base plan and product
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Scale Test Plan',
        price: 150000,
        billingPeriod: BillingPeriod.MONTHLY,
        availableFrom: new Date('2020-01-01'),
        availableTo: new Date('2035-12-31'),
      },
    });
  }

  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Enterprise Cloud License',
        type: ProductType.SOFTWARE,
        salesPrice: 150000,
        costPrice: 50000,
      },
    });
  }

  // Ensure admin user
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const adminId = admin ? admin.id : (await prisma.user.create({
    data: {
      email: 'bench_admin@brightloop.test',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: Role.ADMIN,
    },
  })).id;

  // Generate 500 customer batches
  console.log('Creating customers in batches...');
  const customerBatch = [];
  for (let i = 1; i <= 500; i++) {
    customerBatch.push({
      name: `Enterprise Client ${i}`,
      email: `client${i}@benchmark-corp.com`,
      company: `Corporation ${i} Ltd`,
    });
  }
  await prisma.customer.createMany({ data: customerBatch, skipDuplicates: true });
  const customers = await prisma.customer.findMany({ select: { id: true }, take: 500 });

  console.log(`Using ${customers.length} customers for generation.`);

  const TOTAL_SUBSCRIPTIONS = 5000;
  const BATCH_SIZE = 500;

  console.log(`Generating ${TOTAL_SUBSCRIPTIONS} subscriptions...`);
  for (let batch = 0; batch < TOTAL_SUBSCRIPTIONS / BATCH_SIZE; batch++) {
    const subBatch = [];
    for (let i = 1; i <= BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i;
      const cust = customers[idx % customers.length];
      subBatch.push({
        number: `SUB-BENCH-${String(idx).padStart(7, '0')}`,
        customerId: cust.id,
        planId: plan.id,
        status: idx % 10 === 0 ? SubscriptionStatus.CLOSED : SubscriptionStatus.ACTIVE,
        isPaused: idx % 15 === 0,
        startDate: new Date('2025-01-01'),
        expiryDate: new Date('2028-01-01'),
        nextInvoiceDate: addDays(new Date(), (idx % 30) - 15),
        paymentTerms: PaymentTerms.NET_30,
        createdById: adminId,
      });
    }
    await prisma.subscription.createMany({ data: subBatch, skipDuplicates: true });
    process.stdout.write(`• Batch ${batch + 1}/${TOTAL_SUBSCRIPTIONS / BATCH_SIZE} subscriptions generated\n`);
  }

  // Fetch created subscription IDs
  const subs = await prisma.subscription.findMany({
    select: { id: true, customerId: true, number: true },
    take: TOTAL_SUBSCRIPTIONS,
  });

  console.log('Generating subscription lines...');
  for (let batch = 0; batch < subs.length / BATCH_SIZE; batch++) {
    const slice = subs.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
    const lines = slice.map((s) => ({
      subscriptionId: s.id,
      productId: product.id,
      quantity: 5,
      unitPrice: 150000,
      amount: 750000,
    }));
    await prisma.subscriptionLine.createMany({ data: lines });
  }

  console.log('Generating 20,000 invoices (4 per subscription)...');
  const INVOICES_PER_SUB = 4;
  for (let batch = 0; batch < subs.length / BATCH_SIZE; batch++) {
    const slice = subs.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
    const invoiceBatch = [];
    for (const sub of slice) {
      for (let invIdx = 1; invIdx <= INVOICES_PER_SUB; invIdx++) {
        const periodStart = addMonths(new Date('2025-06-01'), invIdx);
        const periodEnd = addDays(addMonths(periodStart, 1), -1);
        const isPaid = invIdx <= 3;
        const total = 750000;
        invoiceBatch.push({
          number: `INV-BENCH-${sub.number.slice(10)}-${invIdx}`,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          periodStart,
          periodEnd,
          status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.CONFIRMED,
          issueDate: periodStart,
          dueDate: addDays(periodStart, 30),
          subtotal: total,
          discountTotal: 0,
          taxTotal: 0,
          total,
          amountPaid: isPaid ? total : (invIdx % 2 === 0 ? 350000 : 0),
        });
      }
    }
    await prisma.invoice.createMany({ data: invoiceBatch, skipDuplicates: true });
    process.stdout.write(`• Invoices batch ${batch + 1} written\n`);
  }

  console.log('Generating 15,000 payments...');
  const paidInvoices = await prisma.invoice.findMany({
    where: { amountPaid: { gt: 0 } },
    select: { id: true, amountPaid: true, issueDate: true },
    take: 15000,
  });

  for (let batch = 0; batch < paidInvoices.length / BATCH_SIZE; batch++) {
    const slice = paidInvoices.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
    const payments = slice.map((inv) => ({
      invoiceId: inv.id,
      method: PaymentMethod.BANK_TRANSFER,
      amount: inv.amountPaid,
      paidAt: addDays(inv.issueDate, 5),
      note: 'Automated batch benchmark payment',
      recordedById: adminId,
    }));
    await prisma.payment.createMany({ data: payments });
  }

  console.log('✅ High-scale benchmark seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('Benchmark seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

