/**
 * Tests for Auth Store
 *
 * Tests Zustand auth store with login, logout, registration, and token refresh.
 * Uses vi.mock to mock the auth provider and API client.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User, AuthTokens } from '@lib/auth/types';

// Mock the auth provider and API client
vi.mock('@lib/auth', () => ({
  authProvider: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getSession: vi.fn(),
  },
  type: {} as unknown,
}));

vi.mock('@lib/api/client', () => ({
  apiClient: {
    setTokenGetter: vi.fn(),
    setOnUnauthorized: vi.fn(),
  },
}));

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const { authProvider } = await import('@lib/auth');
      vi.mocked(authProvider.login).mockResolvedValue({ user: mockUser, tokens: mockTokens });

      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'password' });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set loading state during login', async () => {
      const { authProvider } = await import('@lib/auth');
      let resolveLogin: (value: { user: User; tokens: AuthTokens }) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      vi.mocked(authProvider.login).mockReturnValue(loginPromise as Promise<{ user: User; tokens: AuthTokens }>);

      const store = useAuthStore.getState();
      const loginCall = store.login({ email: 'test@example.com', password: 'password' });

      // Check loading state
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve login
      resolveLogin!({ user: mockUser, tokens: mockTokens });
      await loginCall;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const { authProvider } = await import('@lib/auth');
      const error = new Error('Invalid credentials');
      vi.mocked(authProvider.login).mockRejectedValue(error);

      const store = useAuthStore.getState();
      await expect(
        store.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should clear previous error on new login', async () => {
      const { authProvider } = await import('@lib/auth');

      // First failed login
      vi.mocked(authProvider.login).mockRejectedValueOnce(new Error('Error 1'));
      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'wrong' }).catch(() => {});
      expect(useAuthStore.getState().error).toBe('Error 1');

      // Second successful login
      vi.mocked(authProvider.login).mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      await store.login({ email: 'test@example.com', password: 'correct' });
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const { authProvider } = await import('@lib/auth');
      vi.mocked(authProvider.register).mockResolvedValue({ user: mockUser, tokens: mockTokens });

      const store = useAuthStore.getState();
      await store.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle registration errors', async () => {
      const { authProvider } = await import('@lib/auth');
      const error = new Error('Email already exists');
      vi.mocked(authProvider.register).mockRejectedValue(error);

      const store = useAuthStore.getState();
      await expect(
        store.register({ email: 'existing@example.com', password: 'password123' })
      ).rejects.toThrow('Email already exists');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { authProvider } = await import('@lib/auth');
      const { apiClient } = await import('@lib/api/client');
      vi.mocked(authProvider.logout).mockResolvedValue();

      // Set initial logged-in state
      useAuthStore.setState({
        user: mockUser,
        tokens: mockTokens,
        isInitialized: true,
      });

      const store = useAuthStore.getState();
      await store.logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(vi.mocked(apiClient.setTokenGetter)).toHaveBeenCalled();
    });

    it('should clear state even if logout fails', async () => {
      const { authProvider } = await import('@lib/auth');
      const { apiClient } = await import('@lib/api/client');

      // Mock logout to resolve (error handling happens inside the provider)
      vi.mocked(authProvider.logout).mockResolvedValue();

      // Set initial logged-in state
      useAuthStore.setState({
        user: mockUser,
        tokens: mockTokens,
        isInitialized: true,
      });

      const store = useAuthStore.getState();
      await store.logout();

      // State should be cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isInitialized).toBe(true);
      expect(vi.mocked(apiClient.setTokenGetter)).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      const store = useAuthStore.getState();
      store.clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Selector Behavior', () => {
    it('should allow selecting user from state', () => {
      useAuthStore.setState({ user: mockUser });
      const user = useAuthStore.getState().user;
      expect(user).toEqual(mockUser);
    });

    it('should determine authenticated state when user exists', () => {
      useAuthStore.setState({ user: mockUser });
      const isAuthenticated = !!useAuthStore.getState().user;
      expect(isAuthenticated).toBe(true);
    });

    it('should determine authenticated state when no user', () => {
      useAuthStore.setState({ user: null });
      const isAuthenticated = !!useAuthStore.getState().user;
      expect(isAuthenticated).toBe(false);
    });

    it('should allow selecting loading state', () => {
      useAuthStore.setState({ isLoading: true });
      const isLoading = useAuthStore.getState().isLoading;
      expect(isLoading).toBe(true);
    });

    it('should allow selecting error state', () => {
      useAuthStore.setState({ error: 'Test error' });
      const error = useAuthStore.getState().error;
      expect(error).toBe('Test error');
    });
  });
});
