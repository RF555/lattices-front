/**
 * Tests for queryClient Configuration
 *
 * Tests the TanStack Query client configuration to ensure it's set up correctly
 * for offline-first operation with appropriate cache timings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock constants before importing queryClient
vi.mock('@/constants', () => ({
  QUERY_CACHE: {
    STALE_LONG: 300000, // 5 minutes
    GC_DEFAULT: 1800000, // 30 minutes
    DEFAULT_RETRY: 3,
  },
  HTTP_STATUS: {
    BAD_REQUEST: 400,
    SERVER_ERROR: 500,
  },
}));

// Mock ApiException
vi.mock('@lib/api/errors', () => ({
  ApiException: {
    isApiException: vi.fn(),
  },
}));

describe('queryClient', () => {
  beforeEach(() => {
    // Clear module cache to get fresh queryClient instance
    vi.resetModules();
  });

  it('should have networkMode set to offlineFirst', async () => {
    const { queryClient } = await import('../queryClient');

    expect(queryClient.getDefaultOptions().queries?.networkMode).toBe('offlineFirst');
  });

  it('should have staleTime set to QUERY_CACHE.STALE_LONG', async () => {
    const { queryClient } = await import('../queryClient');

    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(300000);
  });

  it('should have gcTime set to QUERY_CACHE.GC_DEFAULT', async () => {
    const { queryClient } = await import('../queryClient');

    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(1800000);
  });

  it('should have refetchOnWindowFocus set to false', async () => {
    const { queryClient } = await import('../queryClient');

    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should have mutations retry set to false', async () => {
    const { queryClient } = await import('../queryClient');

    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('should not retry on 4xx errors', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 404 };
    const shouldRetry = retryFn(1, error);

    expect(shouldRetry).toBe(false);
  });

  it('should retry on 5xx errors up to DEFAULT_RETRY times', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 500 };

    // Should retry on 5xx errors
    expect(retryFn(0, error)).toBe(true);
    expect(retryFn(1, error)).toBe(true);
    expect(retryFn(2, error)).toBe(true);

    // Should stop retrying after DEFAULT_RETRY (3) attempts
    expect(retryFn(3, error)).toBe(false);
  });

  it('should retry on network errors up to DEFAULT_RETRY times', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(false);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const networkError = new Error('Network error');

    // Should retry on network errors
    expect(retryFn(0, networkError)).toBe(true);
    expect(retryFn(1, networkError)).toBe(true);
    expect(retryFn(2, networkError)).toBe(true);

    // Should stop after DEFAULT_RETRY
    expect(retryFn(3, networkError)).toBe(false);
  });

  it('should not retry on 400 Bad Request', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 400 };
    expect(retryFn(1, error)).toBe(false);
  });

  it('should not retry on 401 Unauthorized', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 401 };
    expect(retryFn(1, error)).toBe(false);
  });

  it('should not retry on 403 Forbidden', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 403 };
    expect(retryFn(1, error)).toBe(false);
  });

  it('should not retry on 404 Not Found', async () => {
    const { ApiException } = await import('@lib/api/errors');
    const { queryClient } = await import('../queryClient');

    const mockApiException = vi.mocked(ApiException);
    mockApiException.isApiException.mockReturnValue(true);

    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: any,
    ) => boolean;

    const error = { status: 404 };
    expect(retryFn(1, error)).toBe(false);
  });
});
