export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  role: Role;
  customerId?: string | null;
  name?: string;
  customer?: Customer;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  taxId?: string;
  subscriptions?: Array<{ id: string; status: string; number: string }>;
  invoices?: Array<{ id: string; status: string; total: number; amountPaid: number }>;
}

export type ProductType = 'SOFTWARE' | 'SERVICE' | 'ADDON' | 'PHYSICAL';

export interface ProductVariant {
  id: string;
  productId: string;
  attribute: string;
  value: string;
  extraPrice: number; // paise
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: number; // paise
  costPrice: number;  // paise
  notes?: string;
  isActive: boolean;
  variants: ProductVariant[];
}

export type BillingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Plan {
  id: string;
  name: string;
  price: number; // paise
  billingPeriod: BillingPeriod;
  minQuantity: number;
  availableFrom: string;
  availableTo: string;
  autoClose: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenew: boolean;
  isActive: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  ratePercent: number;
  productType?: ProductType | null;
  priority: number;
  isActive: boolean;
}

export type DiscountKind = 'FIXED' | 'PERCENT';
export type DiscountScope = 'PRODUCT' | 'SUBSCRIPTION';

export interface Discount {
  id: string;
  name: string;
  kind: DiscountKind;
  value: number; // paise if FIXED, or percentage integer
  minPurchase?: number | null;
  minQuantity?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  scope: DiscountScope;
  isActive: boolean;
  products?: Array<{ productId: string; product: Product }>;
  subscriptions?: Array<{ subscriptionId: string }>;
}

export interface QuotationTemplateLine {
  id: string;
  templateId: string;
  productId: string;
  product: Product;
  variantId?: string | null;
  variant?: ProductVariant | null;
  quantity: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  validityDays: number;
  planId: string;
  plan: Plan;
  lines: QuotationTemplateLine[];
}

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';
export type PaymentTerms = 'IMMEDIATE' | 'NET_15' | 'NET_30' | 'NET_60';

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  productId: string;
  product: Product;
  variantId?: string | null;
  variant?: ProductVariant | null;
  quantity: number;
  unitPrice: number; // paise
  taxId?: string | null;
  taxRule?: TaxRule | null;
  amount: number; // paise
}

export interface Subscription {
  id: string;
  number: string;
  customerId: string;
  customer: Customer;
  planId: string;
  plan: Plan;
  templateId?: string | null;
  template?: QuotationTemplate | null;
  status: SubscriptionStatus;
  isPaused: boolean;
  startDate: string;
  expiryDate: string;
  nextInvoiceDate: string;
  paymentTerms: PaymentTerms;
  quotationValidUntil?: string | null;
  createdById: string;
  lines: SubscriptionLine[];
  invoices?: Invoice[];
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxName?: string | null;
  taxRate?: number | null;
  taxAmount: number;
  amount: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

export interface Payment {
  id: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number; // paise
  paidAt: string;
  note?: string;
  recordedById: string;
  recordedBy?: { id: string; email: string };
  invoice?: { number: string; total: number; status: InvoiceStatus };
}

export interface Invoice {
  id: string;
  number: string;
  subscriptionId: string;
  subscription: Subscription;
  customerId: string;
  customer: Customer;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  sentAt?: string | null;
  lines: InvoiceLine[];
  payments: Payment[];
  createdAt: string;
}

export interface FinanceSummary {
  activeSubscriptions: number;
  mrr: number; // paise
  revenueCollected: number; // paise
  billedTotal: number; // paise
  outstandingTotal: number; // paise
  overdueCount: number;
  overdueAmount: number;
}

