import { z } from 'zod';

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export const passwordSchema = z
  .string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(
    passwordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
  );

export const registerSchema = z.object({
  email: z.string().email('Valid email is required').transform((val) => val.trim().toLowerCase()),
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').transform((val) => val.trim().toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: passwordSchema,
});

export const createStaffSchema = z.object({
  email: z.string().email('Valid email is required').transform((val) => val.trim().toLowerCase()),
  password: passwordSchema,
  name: z.string().min(2, 'Staff name is required'),
});

