import { PrismaClient, Role, ProductType, BillingPeriod, SubscriptionStatus, PaymentTerms, DiscountKind, DiscountScope, PaymentMethod, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Brightloop database seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceDiscountUse.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.discountSubscription.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationTemplateLine.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

  const strongPasswordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Customers
  const acmeCustomer = await prisma.customer.create({
    data: {
      name: 'Acme Technologies Pvt Ltd',
      email: 'customer@acme.test',
      phone: '+91 98765 43210',
      company: 'Acme Corp',
      address: '100 Innovation Park, Whitefield, Bengaluru, Karnataka 560066',
      taxId: '29ABCDE1234F1Z5',
    },
  });

  const nexusCustomer = await prisma.customer.create({
    data: {
      name: 'Nexus Cloud Systems',
      email: 'billing@nexuscloud.io',
      phone: '+91 98220 11223',
      company: 'Nexus Inc',
      address: '42 Cyber City, DLF Phase 2, Gurugram, Haryana 122002',
      taxId: '06XYZPA9876Q1Z2',
    },
  });

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brightloop.test',
      passwordHash: strongPasswordHash,
      role: Role.ADMIN,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@brightloop.test',
      passwordHash: strongPasswordHash,
      role: Role.STAFF,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@acme.test',
      passwordHash: strongPasswordHash,
      role: Role.CUSTOMER,
      customerId: acmeCustomer.id,
    },
  });

  console.log('✓ Demo users & customers created');

  // 3. Create Tax Rules (PRD §14)
  const softwareTax = await prisma.taxRule.create({
    data: {
      name: 'GST Software 18%',
      ratePercent: 18.0,
      productType: ProductType.SOFTWARE,
      priority: 10,
      isActive: true,
    },
  });

  const serviceTax = await prisma.taxRule.create({
    data: {
      name: 'GST Services 5%',
      ratePercent: 5.0,
      productType: ProductType.SERVICE,
      priority: 5,
      isActive: true,
    },
  });

  console.log('✓ Tax rules configured');

  // 4. Create Products & Variants (PRD §1, §14)
  const crmProduct = await prisma.product.create({
    data: {
      name: 'Brightloop CRM Core',
      type: ProductType.SOFTWARE,
      salesPrice: 200000, // ₹2,000.00
      costPrice: 80000,   // ₹800.00
      notes: 'Enterprise relationship management system',
      variants: {
        create: [
          {
            attribute: 'Brand',
            value: 'Odoo Edition',
            extraPrice: 56000, // +₹560.00 (PRD requirement!)
          },
          {
            attribute: 'Brand',
            value: 'Zoho Edition',
            extraPrice: 30000, // +₹300.00
          },
        ],
      },
    },
    include: { variants: true },
  });

  const analyticsProduct = await prisma.product.create({
    data: {
      name: 'Analytics AI Add-on',
      type: ProductType.ADDON,
      salesPrice: 150000, // ₹1,500.00
      costPrice: 50000,
      notes: 'Real-time cohort & revenue forecasting engine',
    },
  });

  const supportProduct = await prisma.product.create({
    data: {
      name: '24/7 Priority Support Pack',
      type: ProductType.SERVICE,
      salesPrice: 80000, // ₹800.00
      costPrice: 20000,
      notes: 'Dedicated Slack bridge and 15-minute SLA',
    },
  });

  console.log('✓ Catalog products and variants configured');

  // 5. Create Plans (PRD §14)
  const monthlyBasicPlan = await prisma.plan.create({
    data: {
      name: 'Monthly Basic',
      price: 200000, // ₹2,000.00
      billingPeriod: BillingPeriod.MONTHLY,
      minQuantity: 1,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2030-12-31'),
      autoClose: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenew: true,
      isActive: true,
    },
  });

  const yearlyProPlan = await prisma.plan.create({
    data: {
      name: 'Yearly Pro Enterprise',
      price: 2000000, // ₹20,000.00
      billingPeriod: BillingPeriod.YEARLY,
      minQuantity: 5,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2030-12-31'),
      autoClose: true,
      allowEarlyClose: false,
      allowPause: false,
      allowRenew: true,
      isActive: true,
    },
  });

  console.log('✓ Subscription plans created');

  // 6. Create Discounts (PRD §14)
  const volumeDiscount = await prisma.discount.create({
    data: {
      name: 'Volume Seat Discount (10% over 10 seats)',
      kind: DiscountKind.PERCENT,
      value: 10, // 10%
      minQuantity: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2030-12-31'),
      scope: DiscountScope.PRODUCT,
      isActive: true,
      products: {
        create: [{ productId: crmProduct.id }],
      },
    },
  });

  const promoDiscount = await prisma.discount.create({
    data: {
      name: 'Launch Promo ₹500 Off (3 uses max)',
      kind: DiscountKind.FIXED,
      value: 50000, // ₹500.00
      usageLimit: 3,
      usedCount: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2030-12-31'),
      scope: DiscountScope.SUBSCRIPTION,
      isActive: true,
    },
  });

  console.log('✓ Discounts created');

  // 7. Quotation Template
  const odooVariant = crmProduct.variants.find((v) => v.value.includes('Odoo'));
  const template = await prisma.quotationTemplate.create({
    data: {
      name: 'Standard CRM + Analytics Bundle',
      validityDays: 30,
      planId: monthlyBasicPlan.id,
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: odooVariant?.id,
            quantity: 2,
          },
          {
            productId: analyticsProduct.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  // 8. Create Subscriptions
  // Active subscription for Acme Corp
  const odooExtra = odooVariant ? odooVariant.extraPrice : 0;
  const crmEffectivePrice = crmProduct.salesPrice + odooExtra; // 200000 + 56000 = 256000

  const acmeSub = await prisma.subscription.create({
    data: {
      number: 'SUB-000001',
      customerId: acmeCustomer.id,
      planId: monthlyBasicPlan.id,
      templateId: template.id,
      status: SubscriptionStatus.ACTIVE,
      isPaused: false,
      startDate: new Date('2026-09-01'),
      expiryDate: new Date('2027-09-01'),
      nextInvoiceDate: new Date('2026-10-01'),
      paymentTerms: PaymentTerms.NET_15,
      createdById: adminUser.id,
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: odooVariant?.id,
            quantity: 2,
            unitPrice: crmEffectivePrice,
            amount: crmEffectivePrice * 2, // 512000
          },
          {
            productId: supportProduct.id,
            quantity: 1,
            unitPrice: supportProduct.salesPrice,
            amount: supportProduct.salesPrice, // 80000
          },
        ],
      },
    },
  });

  // 9. Create Historical Invoices & Payments for Acme Sub
  // Invoice 1: Sept (Paid)
  const septSubtotal = 592000; // 512000 + 80000
  const septTax = Math.round((512000 * 18) / 100) + Math.round((80000 * 5) / 100); // 92160 + 4000 = 96160
  const septTotal = septSubtotal + septTax; // 688160

  const inv1 = await prisma.invoice.create({
    data: {
      number: 'INV-000001',
      subscriptionId: acmeSub.id,
      customerId: acmeCustomer.id,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      status: InvoiceStatus.PAID,
      issueDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-15'),
      subtotal: septSubtotal,
      discountTotal: 0,
      taxTotal: septTax,
      total: septTotal,
      amountPaid: septTotal,
      lines: {
        create: [
          {
            description: 'Brightloop CRM Core (Brand: Odoo Edition)',
            quantity: 2,
            unitPrice: crmEffectivePrice,
            taxName: 'GST Software 18%',
            taxRate: 18.0,
            taxAmount: Math.round((512000 * 18) / 100),
            amount: 512000,
          },
          {
            description: '24/7 Priority Support Pack',
            quantity: 1,
            unitPrice: supportProduct.salesPrice,
            taxName: 'GST Services 5%',
            taxRate: 5.0,
            taxAmount: Math.round((80000 * 5) / 100),
            amount: 80000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      method: PaymentMethod.BANK_TRANSFER,
      amount: septTotal,
      paidAt: new Date('2026-09-05'),
      note: 'Wire transfer ref #HDFC998231',
      recordedById: staffUser.id,
    },
  });

  // Invoice 2: Oct (Confirmed, partially paid or due for demo)
  const octInv = await prisma.invoice.create({
    data: {
      number: 'INV-000002',
      subscriptionId: acmeSub.id,
      customerId: acmeCustomer.id,
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      status: InvoiceStatus.CONFIRMED,
      issueDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-15'), // Overdue for demo realism!
      subtotal: septSubtotal,
      discountTotal: 50000, // Launch promo discount applied (₹500)
      taxTotal: Math.round(((512000 - 50000) * 18) / 100) + Math.round((80000 * 5) / 100),
      total: septSubtotal - 50000 + (Math.round(((512000 - 50000) * 18) / 100) + Math.round((80000 * 5) / 100)),
      amountPaid: 300000, // Partial payment of ₹3,000
      lines: {
        create: [
          {
            description: 'Brightloop CRM Core (Brand: Odoo Edition)',
            quantity: 2,
            unitPrice: crmEffectivePrice,
            discountAmount: 50000,
            taxName: 'GST Software 18%',
            taxRate: 18.0,
            taxAmount: Math.round(((512000 - 50000) * 18) / 100),
            amount: 512000,
          },
          {
            description: '24/7 Priority Support Pack',
            quantity: 1,
            unitPrice: supportProduct.salesPrice,
            discountAmount: 0,
            taxName: 'GST Services 5%',
            taxRate: 5.0,
            taxAmount: Math.round((80000 * 5) / 100),
            amount: 80000,
          },
        ],
      },
      discountUses: {
        create: [
          {
            discountId: promoDiscount.id,
            amount: 50000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: octInv.id,
      method: PaymentMethod.UPI,
      amount: 300000,
      paidAt: new Date('2026-10-10'),
      note: 'Partial payment via UPI acme@icici',
      recordedById: staffUser.id,
    },
  });

  console.log('✓ Subscriptions, Invoices, and Payments seeded successfully');
  console.log('\n===========================================');
  console.log('DEMO ACCOUNTS READY (PRD §14):');
  console.log('Admin:    admin@brightloop.test    | Password123!');
  console.log('Staff:    staff@brightloop.test    | Password123!');
  console.log('Customer: customer@acme.test       | Password123!');
  console.log('===========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

