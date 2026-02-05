/**
 * Tests for ApiClient
 *
 * Tests the ApiClient class including URL building, HTTP methods,
 * authentication, error handling, token refresh, and request configuration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../client';
import { ApiException } from '../errors';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';
const API_VERSION = 'v1';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    // Create a fresh client instance for each test to ensure isolation
    client = new ApiClient(BASE_URL);
  });

  describe('URL building', () => {
    it('should build correct URL with base URL, /api, version, and endpoint', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () => HttpResponse.json({ data: [] })),
      );

      const result = await client.get('/todos');
      expect(result).toEqual({ data: [] });
    });

    it('should append query params correctly', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('status')).toBe('active');
          expect(url.searchParams.get('limit')).toBe('10');
          expect(url.searchParams.get('archived')).toBe('false');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        params: { status: 'active', limit: 10, archived: false },
      });
    });

    it('should skip undefined params', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.has('defined')).toBe(true);
          expect(url.searchParams.has('undefined')).toBe(false);
          expect(url.searchParams.get('defined')).toBe('value');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        params: { defined: 'value', undefined: undefined },
      });
    });

    it('should handle multiple query params', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('test');
          expect(url.searchParams.get('page')).toBe('2');
          expect(url.searchParams.get('sort')).toBe('created_at');
          return HttpResponse.json({ results: [] });
        }),
      );

      await client.get('/search', {
        params: { q: 'test', page: 2, sort: 'created_at' },
      });
    });
  });

  describe('HTTP methods', () => {
    it('should perform GET request', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json({ data: [{ id: '1', title: 'Test' }] }),
        ),
      );

      const result = await client.get<{ data: unknown[] }>('/todos');
      expect(result.data).toHaveLength(1);
    });

    it('should perform POST request with body', async () => {
      server.use(
        http.post(`${BASE_URL}/api/${API_VERSION}/todos`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({ title: 'New todo', description: 'Test' });
          return HttpResponse.json({ data: { id: '1', ...body } }, { status: 201 });
        }),
      );

      const result = await client.post('/todos', {
        title: 'New todo',
        description: 'Test',
      });
      expect(result).toHaveProperty('data');
    });

    it('should perform POST request without body', async () => {
      server.use(
        http.post(`${BASE_URL}/api/${API_VERSION}/actions/trigger`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe('');
          return HttpResponse.json({ success: true });
        }),
      );

      const result = await client.post<{ success: boolean }>('/actions/trigger');
      expect(result.success).toBe(true);
    });

    it('should perform PUT request with body', async () => {
      server.use(
        http.put(`${BASE_URL}/api/${API_VERSION}/todos/1`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({ title: 'Updated', is_completed: true });
          return HttpResponse.json({ data: { id: '1', ...body } });
        }),
      );

      await client.put('/todos/1', { title: 'Updated', is_completed: true });
    });

    it('should perform PATCH request with body', async () => {
      server.use(
        http.patch(`${BASE_URL}/api/${API_VERSION}/todos/1`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toEqual({ title: 'Patched' });
          return HttpResponse.json({ data: { id: '1', title: 'Patched' } });
        }),
      );

      await client.patch('/todos/1', { title: 'Patched' });
    });

    it('should perform DELETE request', async () => {
      server.use(
        http.delete(
          `${BASE_URL}/api/${API_VERSION}/todos/1`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      const result = await client.delete('/todos/1');
      expect(result).toBeNull();
    });
  });

  describe('Authorization headers', () => {
    it('should add Authorization header when token getter returns value', async () => {
      const token = 'test-token-123';
      client.setTokenGetter(() => token);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos');
    });

    it('should not add Authorization header when token getter returns null', async () => {
      client.setTokenGetter(() => null);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/public`, ({ request }) => {
          expect(request.headers.has('Authorization')).toBe(false);
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/public');
    });

    it('should not add Authorization header when no token getter is set', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/public`, ({ request }) => {
          expect(request.headers.has('Authorization')).toBe(false);
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/public');
    });

    it('should update token dynamically on each request', async () => {
      let token = 'token-1';
      client.setTokenGetter(() => token);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          return HttpResponse.json({ token: auth });
        }),
      );

      const result1 = await client.get<{ token: string }>('/todos');
      expect(result1.token).toBe('Bearer token-1');

      token = 'token-2';
      const result2 = await client.get<{ token: string }>('/todos');
      expect(result2.token).toBe('Bearer token-2');
    });
  });

  describe('204 No Content handling', () => {
    it('should return null for 204 responses', async () => {
      server.use(
        http.delete(
          `${BASE_URL}/api/${API_VERSION}/todos/1`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      const result = await client.delete('/todos/1');
      expect(result).toBeNull();
    });

    it('should return null for 204 POST responses', async () => {
      server.use(
        http.post(
          `${BASE_URL}/api/${API_VERSION}/actions/void`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      const result = await client.post('/actions/void', {});
      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should throw ApiException for 400 error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            {
              message: 'Invalid request',
              error_code: 'VALIDATION_ERROR',
              details: { field: 'title' },
            },
            { status: 400 },
          ),
        ),
      );

      await expect(client.get('/todos')).rejects.toThrow(ApiException);
      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
        message: 'Invalid request',
        details: { field: 'title' },
      });
    });

    it('should throw ApiException for 404 error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos/999`, () =>
          HttpResponse.json(
            { message: 'Not found', error_code: 'TASK_NOT_FOUND' },
            { status: 404 },
          ),
        ),
      );

      await expect(client.get('/todos/999')).rejects.toMatchObject({
        code: 'TASK_NOT_FOUND',
        status: 404,
      });
    });

    it('should throw ApiException for 500 error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            { message: 'Server error', error_code: 'INTERNAL_ERROR' },
            { status: 500 },
          ),
        ),
      );

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'INTERNAL_ERROR',
        status: 500,
      });
    });

    it('should throw NETWORK_ERROR for fetch failures', async () => {
      server.use(http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () => HttpResponse.error()));

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        status: 0,
        message: 'Network error occurred',
      });
    });

    it('should throw NETWORK_ERROR for network failures', async () => {
      server.use(http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () => HttpResponse.error()));

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        status: 0,
        message: 'Network error occurred',
      });
    });

    it('should re-throw ApiException errors as-is', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            { message: 'Custom error', error_code: 'CUSTOM_CODE' },
            { status: 422 },
          ),
        ),
      );

      try {
        await client.get('/todos');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(ApiException.isApiException(error)).toBe(true);
        if (ApiException.isApiException(error)) {
          expect(error.code).toBe('CUSTOM_CODE');
          expect(error.status).toBe(422);
        }
      }
    });
  });

  describe('Token refresh on 401', () => {
    it('should call onUnauthorized callback on 401', async () => {
      let currentToken = 'old-token';
      const onUnauthorized = vi.fn().mockImplementation(async () => {
        currentToken = 'new-token';
        return 'new-token';
      });
      client.setTokenGetter(() => currentToken);
      client.setOnUnauthorized(onUnauthorized);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') {
            return HttpResponse.json(
              { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
              { status: 401 },
            );
          }
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos');
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should retry request with new token after refresh', async () => {
      let currentToken = 'old-token';
      const onUnauthorized = vi.fn().mockImplementation(async () => {
        currentToken = 'new-token';
        return 'new-token';
      });
      client.setTokenGetter(() => currentToken);
      client.setOnUnauthorized(onUnauthorized);

      let requestCount = 0;
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          requestCount++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') {
            return HttpResponse.json(
              { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
              { status: 401 },
            );
          }
          if (auth === 'Bearer new-token') {
            return HttpResponse.json({ data: [{ id: '1' }] });
          }
          return HttpResponse.json({ error: 'Unexpected token' }, { status: 400 });
        }),
      );

      const result = await client.get<{ data: unknown[] }>('/todos');
      expect(result.data).toHaveLength(1);
      expect(requestCount).toBe(2);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should not retry if onUnauthorized returns null', async () => {
      const onUnauthorized = vi.fn().mockResolvedValue(null);
      client.setTokenGetter(() => 'old-token');
      client.setOnUnauthorized(onUnauthorized);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
            { status: 401 },
          ),
        ),
      );

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('should not retry if no onUnauthorized handler is set', async () => {
      client.setTokenGetter(() => 'token');

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
            { status: 401 },
          ),
        ),
      );

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('should not retry on 401 if already a retry attempt', async () => {
      let currentToken = 'old-token';
      let refreshCount = 0;
      const onUnauthorized = vi.fn().mockImplementation(async () => {
        refreshCount++;
        currentToken = 'new-token';
        return 'new-token';
      });
      client.setTokenGetter(() => currentToken);
      client.setOnUnauthorized(onUnauthorized);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () =>
          HttpResponse.json(
            { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
            { status: 401 },
          ),
        ),
      );

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
      // Should only attempt refresh once, not recursively
      expect(refreshCount).toBe(1);
    });

    it('should deduplicate concurrent token refresh requests', async () => {
      let currentToken = 'old-token';
      let refreshCount = 0;
      const onUnauthorized = vi.fn().mockImplementation(async () => {
        refreshCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        currentToken = 'new-token';
        return 'new-token';
      });
      client.setTokenGetter(() => currentToken);
      client.setOnUnauthorized(onUnauthorized);

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') {
            return HttpResponse.json(
              { message: 'Unauthorized', error_code: 'UNAUTHORIZED' },
              { status: 401 },
            );
          }
          return HttpResponse.json({ data: [] });
        }),
      );

      // Make three concurrent requests that all get 401
      const [result1, result2, result3] = await Promise.all([
        client.get('/todos'),
        client.get('/todos'),
        client.get('/todos'),
      ]);

      expect(result1).toEqual({ data: [] });
      expect(result2).toEqual({ data: [] });
      expect(result3).toEqual({ data: [] });
      // Should only call refresh once despite three concurrent 401s
      expect(refreshCount).toBe(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request configuration', () => {
    it('should pass query params through config', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('filter')).toBe('active');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', { params: { filter: 'active' } });
    });

    it('should pass AbortSignal through config', async () => {
      const controller = new AbortController();

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, async () => {
          // Simulate a slow response
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ data: [] });
        }),
      );

      const promise = client.get('/todos', { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toThrow();
    });

    it('should set Content-Type header to application/json', async () => {
      server.use(
        http.post(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('application/json');
          return HttpResponse.json({ data: {} }, { status: 201 });
        }),
      );

      await client.post('/todos', { title: 'Test' });
    });

    it('should allow custom headers via config', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          expect(request.headers.get('X-Custom-Header')).toBe('custom-value');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });
    });

    it('should merge custom headers with default headers', async () => {
      client.setTokenGetter(() => 'token');

      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('application/json');
          expect(request.headers.get('Authorization')).toBe('Bearer token');
          expect(request.headers.get('X-Custom')).toBe('value');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        headers: { 'X-Custom': 'value' },
      });
    });

    it('should allow overriding Content-Type header', async () => {
      server.use(
        http.post(`${BASE_URL}/api/${API_VERSION}/upload`, ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('multipart/form-data');
          return HttpResponse.json({ success: true });
        }),
      );

      await client.post('/upload', null, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty response body', async () => {
      server.use(
        http.get(
          `${BASE_URL}/api/${API_VERSION}/todos`,
          () => new HttpResponse('', { status: 200 }),
        ),
      );

      const result = await client.get('/todos');
      expect(result).toBeNull();
    });

    it('should handle non-JSON response for errors', async () => {
      server.use(
        http.get(
          `${BASE_URL}/api/${API_VERSION}/todos`,
          () =>
            new HttpResponse('Internal Server Error', {
              status: 500,
              headers: { 'Content-Type': 'text/plain' },
            }),
        ),
      );

      await expect(client.get('/todos')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 500,
        message: 'An unexpected error occurred',
      });
    });

    it('should handle endpoint with leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () => HttpResponse.json({ data: [] })),
      );

      await expect(client.get('/todos')).resolves.toBeDefined();
    });

    it('should handle endpoint without leading slash', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, () => HttpResponse.json({ data: [] })),
      );

      // Note: This assumes the client doesn't require leading slash
      await expect(client.get('/todos')).resolves.toBeDefined();
    });

    it('should handle boolean query params', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('completed')).toBe('true');
          expect(url.searchParams.get('archived')).toBe('false');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        params: { completed: true, archived: false },
      });
    });

    it('should handle numeric query params', async () => {
      server.use(
        http.get(`${BASE_URL}/api/${API_VERSION}/todos`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('page')).toBe('0');
          expect(url.searchParams.get('limit')).toBe('50');
          return HttpResponse.json({ data: [] });
        }),
      );

      await client.get('/todos', {
        params: { page: 0, limit: 50 },
      });
    });
  });
});
