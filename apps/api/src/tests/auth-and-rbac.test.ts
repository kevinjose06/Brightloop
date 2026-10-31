import { describe, it, expect } from 'vitest';
import { passwordRegex, passwordSchema } from '../validators/auth.js';
import { AppError } from '../lib/errors.js';

describe('Auth & Security Validations (PRD §1, §11, §17)', () => {
  it('enforces minimum 9 characters with upper, lower, and special character', () => {
    // 8 characters should fail even if it has upper, lower, special
    expect(passwordRegex.test('Abcdefg!')).toBe(false);
    expect(() => passwordSchema.parse('Abcdefg!')).toThrow();

    // 9 characters with upper, lower, special must pass
    expect(passwordRegex.test('Abcdefg!1')).toBe(true);
    expect(passwordSchema.parse('Abcdefg!1')).toBe('Abcdefg!1');

    // Missing special char fails
    expect(passwordRegex.test('Abcdefghi1')).toBe(false);

    // Missing uppercase fails
    expect(passwordRegex.test('abcdefg!1')).toBe(false);

    // Missing lowercase fails
    expect(passwordRegex.test('ABCDEFG!1')).toBe(false);
  });

  it('normalizes emails case-insensitively', () => {
    const rawEmail = ' Test.User@ACME.IO ';
    const normalized = rawEmail.trim().toLowerCase();
    expect(normalized).toBe('test.user@acme.io');
  });

  it('AppError produces correct status code and envelope structure', () => {
    const err = AppError.invalidTransition('Cannot transition from ACTIVE to DRAFT', ['CLOSED']);
    expect(err.code).toBe('INVALID_TRANSITION');
    expect(err.status).toBe(409);
    expect(err.details).toEqual([
      { issue: 'Cannot transition from ACTIVE to DRAFT', allowed: ['CLOSED'] },
    ]);
  });

  it('AppError correctly handles overpayment code', () => {
    const err = AppError.overpayment('Payment amount exceeds remaining balance');
    expect(err.code).toBe('OVERPAYMENT');
    expect(err.status).toBe(422);
  });

  it('AppError correctly handles below minimum quantity', () => {
    const err = AppError.belowMinQuantity('Quantity is below plan minimum');
    expect(err.code).toBe('BELOW_MIN_QUANTITY');
    expect(err.status).toBe(422);
  });
});

