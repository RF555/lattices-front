import i18n from '@i18n/i18n';
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
      details: body?.details as Record<string, unknown> | undefined,
    };
    return new ApiException(apiError);
  }
}

/**
 * Get a localized error message for an API error code.
 * Falls back to the generic UNKNOWN message if the code is not found.
 */
export function getErrorMessage(code: string): string {
  const key = `apiErrors.${code}` as const;
  const translated = i18n.t(key as 'apiErrors.UNKNOWN');
  // If i18next returns the key itself, the code wasn't found -- use UNKNOWN fallback
  if (translated === key) {
    return i18n.t('apiErrors.UNKNOWN');
  }
  return translated;
}

/**
 * @deprecated Use `getErrorMessage(code)` instead. Kept for backward compatibility.
 */
export const ERROR_MESSAGES = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getErrorMessage(prop);
  },
});
