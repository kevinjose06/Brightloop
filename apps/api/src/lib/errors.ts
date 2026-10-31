export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_TRANSITION'
  | 'OVERPAYMENT'
  | 'PLAN_UNAVAILABLE'
  | 'BELOW_MIN_QUANTITY'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface ErrorDetail {
  field?: string;
  issue: string;
  allowed?: string[];
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: ErrorDetail[] | Record<string, unknown>;

  constructor(
    code: ErrorCode,
    status: number,
    message: string,
    details?: ErrorDetail[] | Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: ErrorDetail[]) {
    return new AppError('VALIDATION_ERROR', 400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError('UNAUTHENTICATED', 401, message);
  }

  static forbidden(message = 'Access forbidden') {
    return new AppError('FORBIDDEN', 403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError('NOT_FOUND', 404, message);
  }

  static conflict(message: string, details?: ErrorDetail[]) {
    return new AppError('CONFLICT', 409, message, details);
  }

  static invalidTransition(message: string, allowedNextStates: string[]) {
    return new AppError('INVALID_TRANSITION', 409, message, [{ issue: message, allowed: allowedNextStates }]);
  }

  static overpayment(message = 'Payment amount exceeds remaining balance') {
    return new AppError('OVERPAYMENT', 422, message);
  }

  static planUnavailable(message = 'The selected plan is not currently available') {
    return new AppError('PLAN_UNAVAILABLE', 422, message);
  }

  static belowMinQuantity(message: string) {
    return new AppError('BELOW_MIN_QUANTITY', 422, message);
  }

  static rateLimited(message = 'Rate limit exceeded. Please try again later.') {
    return new AppError('RATE_LIMITED', 429, message);
  }

  static internal(message = 'An unexpected internal error occurred') {
    return new AppError('INTERNAL', 500, message);
  }
}

