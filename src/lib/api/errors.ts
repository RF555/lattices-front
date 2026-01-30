import type { ApiError } from './types';

export class ApiException extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details ?? undefined;
  }

  static isApiException(error: unknown): error is ApiException {
    return error instanceof ApiException;
  }

  static fromResponse(response: Response, data: unknown): ApiException {
    const body = data as Record<string, unknown> | null;
    const apiError: ApiError = {
      message: (body?.message as string) || 'An unexpected error occurred',
      code: (body?.error_code as string) || 'UNKNOWN_ERROR',
      status: response.status,
      details: (body?.details as Record<string, unknown> | undefined) ?? undefined,
    };
    return new ApiException(apiError);
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Please sign in to continue',
  INVALID_TOKEN: 'Your session has expired. Please sign in again',
  FORBIDDEN: 'You do not have permission to perform this action',
  TASK_NOT_FOUND: 'The requested task was not found',
  TAG_NOT_FOUND: 'The requested tag was not found',
  USER_NOT_FOUND: 'User profile not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  CIRCULAR_REFERENCE: 'This move would create a circular reference',
  DUPLICATE_TAG: 'A tag with this name already exists',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  DATABASE_ERROR: 'A database error occurred. Please try again later',
  NETWORK_ERROR: 'Unable to connect to the server',
};
