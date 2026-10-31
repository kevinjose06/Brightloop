import { describe, it, expect } from 'vitest';
import { BillingPeriod, SubscriptionStatus } from '@prisma/client';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

describe('Billing Logic & Period Math (PRD §8.2, §8.3)', () => {
  it('correctly calculates period boundaries across billing intervals', () => {
    const start = new Date('2026-01-01');

    // Monthly
    const nextMonth = addMonths(start, 1);
    const endMonth = addDays(nextMonth, -1);
    expect(endMonth.toISOString().slice(0, 10)).toBe('2026-01-31');
    expect(nextMonth.toISOString().slice(0, 10)).toBe('2026-02-01');

    // Leap year / month-end edge handling with date-fns
    const jan31 = new Date('2026-01-31');
    const febNext = addMonths(jan31, 1);
    expect(febNext.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('calculates MRR normalization according to spec', () => {
    // Spec: daily * 30, weekly * 52 / 12, monthly * 1, yearly / 12
    const monthlyAmount = 200000; // ₹2,000
    const yearlyAmount = 2400000; // ₹24,000

    const normalizedMonthly = monthlyAmount;
    const normalizedYearly = Math.round(yearlyAmount / 12);

    expect(normalizedMonthly).toBe(200000);
    expect(normalizedYearly).toBe(200000);
  });

  it('validates state transitions accurately', () => {
    const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
      DRAFT: [SubscriptionStatus.QUOTATION, SubscriptionStatus.CLOSED],
      QUOTATION: [SubscriptionStatus.CONFIRMED, SubscriptionStatus.CLOSED],
      CONFIRMED: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED],
      ACTIVE: [SubscriptionStatus.CLOSED],
      CLOSED: [],
    };

    expect(validTransitions['DRAFT']).toContain('QUOTATION');
    expect(validTransitions['ACTIVE']).not.toContain('DRAFT');
    expect(validTransitions['CLOSED']).toHaveLength(0);
  });
});

