/**
 * Tests for API Error Handling
 *
 * Tests the ApiException class and error message constants.
 */

import { describe, it, expect } from 'vitest';
import { ApiException, ERROR_MESSAGES, getErrorMessage } from './errors';
import type { ApiError } from './types';

describe('ApiException', () => {
  it('should create exception from ApiError', () => {
    const error: ApiError = {
      message: 'Test error',
      code: 'TEST_ERROR',
      status: 400,
      details: { field: 'value' },
    };

    const exception = new ApiException(error);

    expect(exception.message).toBe('Test error');
    expect(exception.code).toBe('TEST_ERROR');
    expect(exception.status).toBe(400);
    expect(exception.details).toEqual({ field: 'value' });
    expect(exception.name).toBe('ApiException');
  });

  it('should create exception without details', () => {
    const error: ApiError = {
      message: 'Simple error',
      code: 'SIMPLE',
      status: 500,
    };

    const exception = new ApiException(error);

    expect(exception.message).toBe('Simple error');
    expect(exception.details).toBeUndefined();
  });

  it('should identify ApiException instances', () => {
    const apiError: ApiError = {
      message: 'Test',
      code: 'TEST',
      status: 400,
    };
    const exception = new ApiException(apiError);
    const regularError = new Error('Regular error');

    expect(ApiException.isApiException(exception)).toBe(true);
    expect(ApiException.isApiException(regularError)).toBe(false);
    expect(ApiException.isApiException(null)).toBe(false);
    expect(ApiException.isApiException(undefined)).toBe(false);
    expect(ApiException.isApiException('string')).toBe(false);
  });

  describe('fromResponse', () => {
    it('should create exception from Response with full error data', () => {
      const response = new Response(null, { status: 404 });
      const data = {
        message: 'Resource not found',
        error_code: 'TASK_NOT_FOUND',
        details: { id: '123' },
      };

      const exception = ApiException.fromResponse(response, data);

      expect(exception.message).toBe('Resource not found');
      expect(exception.code).toBe('TASK_NOT_FOUND');
      expect(exception.status).toBe(404);
      expect(exception.details).toEqual({ id: '123' });
    });

    it('should use default message when data is incomplete', () => {
      const response = new Response(null, { status: 500 });
      const data = {};

      const exception = ApiException.fromResponse(response, data);

      expect(exception.message).toBe('An unexpected error occurred');
      expect(exception.code).toBe('UNKNOWN_ERROR');
      expect(exception.status).toBe(500);
    });

    it('should handle null data', () => {
      const response = new Response(null, { status: 503 });

      const exception = ApiException.fromResponse(response, null);

      expect(exception.message).toBe('An unexpected error occurred');
      expect(exception.code).toBe('UNKNOWN_ERROR');
      expect(exception.status).toBe(503);
    });

    it('should handle various HTTP status codes', () => {
      const statuses = [400, 401, 403, 404, 422, 500, 502, 503];

      for (const status of statuses) {
        const response = new Response(null, { status });
        const exception = ApiException.fromResponse(response, {
          message: `Error ${status}`,
          error_code: 'TEST',
        });
        expect(exception.status).toBe(status);
      }
    });
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have predefined error messages', () => {
    expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Please sign in to continue');
    expect(ERROR_MESSAGES.INVALID_TOKEN).toBe('Your session has expired. Please sign in again');
    expect(ERROR_MESSAGES.FORBIDDEN).toBe('You do not have permission to perform this action');
    expect(ERROR_MESSAGES.TASK_NOT_FOUND).toBe('The requested task was not found');
    expect(ERROR_MESSAGES.TAG_NOT_FOUND).toBe('The requested tag was not found');
    expect(ERROR_MESSAGES.VALIDATION_ERROR).toBe('Please check your input and try again');
    expect(ERROR_MESSAGES.CIRCULAR_REFERENCE).toBe('This move would create a circular reference');
    expect(ERROR_MESSAGES.DUPLICATE_TAG).toBe('A tag with this name already exists');
    expect(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED).toBe('Too many requests. Please try again later');
    expect(ERROR_MESSAGES.INTERNAL_ERROR).toBe('Something went wrong. Please try again later');
    expect(ERROR_MESSAGES.DATABASE_ERROR).toBe('A database error occurred. Please try again later');
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('Unable to connect to the server');
  });

  it('should return fallback for unknown error codes', () => {
    expect(getErrorMessage('NONEXISTENT_CODE')).toBe('An unexpected error occurred');
  });
});
