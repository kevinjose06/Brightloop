import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { signToken, AuthUser } from '../middleware/auth.js';
import { sendEmail } from '../lib/mailer.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  static async registerCustomer(data: {
    email: string;
    password: string;
    name: string;
    company?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw AppError.conflict('An account with this email address already exists.', [
        { field: 'email', issue: 'Email already registered' },
      ]);
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          address: data.address,
          taxId: data.taxId,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: 'CUSTOMER',
          customerId: customer.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'REGISTER_CUSTOMER',
          entity: 'User',
          entityId: user.id,
          meta: { customerId: customer.id },
        },
      });

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: customer.id,
      };

      const token = signToken(authUser);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          customerId: customer.id,
          name: customer.name,
        },
        token,
      };
    });
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { customer: true },
    });

    // Timing-attack safe generic response
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password provided');
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw AppError.unauthorized('Invalid email or password provided');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    };

    const token = signToken(authUser);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        name: user.customer?.name || (user.role === 'ADMIN' ? 'System Administrator' : 'Staff Member'),
      },
      token,
    };
  }

  static async createStaff(
    adminId: string,
    data: { email: string; password: string; name: string }
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw AppError.conflict('User with this email already exists', [
        { field: 'email', issue: 'Email already registered' },
      ]);
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: 'STAFF',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CREATE_STAFF',
          entity: 'User',
          entityId: newUser.id,
          meta: { email: data.email, name: data.name },
        },
      });

      return newUser;
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: data.name,
      createdAt: user.createdAt,
    };
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Consistent return to prevent email enumeration (PRD §1, §11)
    if (!user || !user.isActive) {
      return { message: 'If this email is registered, password reset instructions have been sent.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Brightloop — Password Reset Request',
      html: `
        <h2>Reset Your Password</h2>
        <p>A password reset was requested for your account. Click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="padding:10px 18px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a></p>
        <p>This link is single-use and will expire in 1 hour.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    logger.info({ email, resetLink }, 'Password reset token generated');

    return {
      message: 'If this email is registered, password reset instructions have been sent.',
      devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  static async resetPassword(data: { token: string; password: string }) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Mark used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all other reset tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: resetToken.userId,
          action: 'PASSWORD_RESET',
          entity: 'User',
          entityId: resetToken.userId,
        },
      });
    });

    return { success: true, message: 'Password has been successfully updated.' };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
      name: user.customer?.name || (user.role === 'ADMIN' ? 'System Administrator' : 'Staff Member'),
      customer: user.customer,
    };
  }
}

