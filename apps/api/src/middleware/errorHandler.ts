import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const requestId = req.requestId || (req.headers['x-request-id'] as string) || crypto.randomUUID();

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        code: err.code,
        status: err.status,
        message: err.message,
        details: err.details,
      },
      'Application warning/error handled'
    );

    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
        requestId,
      },
    });
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));

    logger.warn({ requestId, details }, 'Validation error handled');

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided',
        details,
        requestId,
      },
    });
  }

  // Handle Prisma Known Request Errors
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code: string; meta?: Record<string, unknown> };
    if (prismaErr.code === 'P2002') {
      const target = (prismaErr.meta?.target as string[]) || [];
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `Unique constraint failed on: ${target.join(', ')}`,
          details: [{ field: target.join(', '), issue: 'Already exists' }],
          requestId,
        },
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Target record was not found',
          details: [],
          requestId,
        },
      });
    }
  }

  // Unhandled internal errors
  logger.error({ requestId, err }, 'Unhandled internal server error');

  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'An unexpected internal error occurred',
      details: [],
      requestId,
    },
  });
}

