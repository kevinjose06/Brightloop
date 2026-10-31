import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  customerId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop-super-secret-jwt-key-2026';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId || null,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(AppError.unauthorized('No authentication token provided'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    return next(AppError.unauthorized('Invalid or expired authentication token'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Role ${req.user.role} is not authorized for this resource`));
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireStaffOrAdmin = requireRole('ADMIN', 'STAFF');

