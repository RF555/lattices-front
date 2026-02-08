import { ApiException } from './errors';
import { HTTP_STATUS, HTTP_HEADERS } from '@/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  /** AbortSignal from TanStack Query for request cancellation on unmount (fixes H5). */
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;
  private getAccessToken: (() => string | null) | null = null;
  private onUnauthorized: (() => Promise<string | null>) | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenGetter(getter: () => string | null): void {
    this.getAccessToken = getter;
  }

  /**
   * Set callback for 401 responses. Should attempt token refresh
   * and return new access token, or null if refresh fails.
   */
  setOnUnauthorized(handler: () => Promise<string | null>): void {
    this.onUnauthorized = handler;
  }

  /**
   * Attempt token refresh, deduplicating concurrent requests.
   */
  private async tryRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    if (!this.onUnauthorized) return null;

    this.isRefreshing = true;
    this.refreshPromise = this.onUnauthorized().finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}/api/${API_VERSION}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    _isRetry = false,
  ): Promise<T> {
    const { params, signal, ...fetchConfig } = config;
    const url = this.buildUrl(endpoint, params);

    const headers: Record<string, string> = {
      'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
      ...(config.headers as Record<string, string> | undefined),
    };

    const token = this.getAccessToken?.();
    if (token) {
      headers.Authorization = `${HTTP_HEADERS.AUTH_PREFIX} ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal,
      });

      // Handle 204 No Content (e.g., DELETE responses)
      if (response.status === HTTP_STATUS.NO_CONTENT) {
        return null as T;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        // Auto-refresh on 401
        if (response.status === HTTP_STATUS.UNAUTHORIZED && !_isRetry) {
          const newToken = await this.tryRefresh();
          if (newToken) {
            return await this.request<T>(endpoint, config, true);
          }
        }
        throw ApiException.fromResponse(response, data);
      }

      return data as T;
    } catch (error) {
      if (ApiException.isApiException(error)) {
        throw error;
      }

      throw new ApiException({
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        status: 0,
      });
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);
export { ApiClient };
