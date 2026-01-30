import { apiClient } from '@lib/api/client';
import type {
  IAuthProvider,
  User,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
} from '../types';

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

/**
 * Decode JWT payload to extract expiry time.
 * Falls back to expires_in from response, or 30 min default.
 */
function getExpiresAt(accessToken: string, expiresIn?: number): number {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    if (payload.exp) {
      return payload.exp * 1000;
    }
  } catch {
    // Invalid JWT format, fall through
  }
  const seconds = expiresIn || 30 * 60;
  return Date.now() + seconds * 1000;
}

export class JwtAuthProvider implements IAuthProvider {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    return {
      user: response.user,
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: getExpiresAt(response.access_token, response.expires_in),
      },
    };
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);

    return {
      user: response.user,
      tokens: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: getExpiresAt(response.access_token, response.expires_in),
      },
    };
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: getExpiresAt(response.access_token, response.expires_in),
    };
  }

  async getSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      const tokens = this.getStoredTokens();

      if (!tokens) return null;

      return {
        user: response.user,
        tokens,
      };
    } catch {
      return null;
    }
  }

  async resetPassword(email: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { email });
  }

  /**
   * Read tokens from Zustand's persist storage (auth-storage key).
   * Single source of truth - no dual storage conflict.
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const tokens = parsed?.state?.tokens;
      if (!tokens?.accessToken) return null;

      return tokens as AuthTokens;
    } catch {
      return null;
    }
  }
}
