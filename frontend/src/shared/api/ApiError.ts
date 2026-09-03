export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorOptions {
  status: number;
  code: string;
  message: string;
  correlationId?: string;
  fieldErrors?: FieldError[];
  retryAfterSeconds?: number;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;
  readonly fieldErrors: FieldError[];
  readonly retryAfterSeconds?: number;
  readonly details?: unknown;

  constructor({ status, code, message, correlationId, fieldErrors, retryAfterSeconds, details }: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
    this.fieldErrors = fieldErrors ?? [];
    this.retryAfterSeconds = retryAfterSeconds;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 400 || error.status === 422);
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}

export function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

export function getFieldErrors(error: unknown, field?: string): FieldError[] {
  if (!(error instanceof ApiError)) {
    return [];
  }
  return field ? error.fieldErrors.filter((fieldError) => fieldError.field === field) : error.fieldErrors;
}

export function getRetryAfter(error: unknown): number | undefined {
  return error instanceof ApiError ? error.retryAfterSeconds : undefined;
}
