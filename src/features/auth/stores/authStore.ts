import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  authProvider,
  type User,
  type AuthTokens,
  type LoginCredentials,
  type RegisterCredentials,
} from '@lib/auth';
import { apiClient } from '@lib/api/client';
import { realtimeManager } from '@lib/realtime';
import { queryClient } from '@/app/providers/queryClient';
import { useWorkspaceUiStore } from '@features/workspaces/stores/workspaceUiStore';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isInitialized: boolean;
  isExplicitLogout: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isInitialized: false,
  isExplicitLogout: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        // Wire up token getter and 401 auto-refresh handler
        apiClient.setTokenGetter(() => get().tokens?.accessToken ?? null);
        apiClient.setOnUnauthorized(async () => {
          const currentTokens = get().tokens;
          if (!currentTokens?.refreshToken) return null;

          try {
            const newTokens = await authProvider.refreshToken(currentTokens.refreshToken);
            realtimeManager.setAuth(newTokens.accessToken);
            set({ tokens: newTokens });
            return newTokens.accessToken;
          } catch {
            // Refresh failed - force logout
            queryClient.clear();
            set({ ...initialState, isInitialized: true });
            return null;
          }
        });

        try {
          const session = await authProvider.getSession();

          if (session) {
            realtimeManager.setAuth(session.tokens.accessToken);
            set({
              user: session.user,
              tokens: session.tokens,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({ isInitialized: true, isLoading: false });
          }
        } catch (error) {
          console.error('[Auth] Initialization failed:', error);
          set({ isInitialized: true, isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { user, tokens } = await authProvider.login(credentials);
          queryClient.clear();
          realtimeManager.setAuth(tokens.accessToken);
          set({ user, tokens, isLoading: false, isExplicitLogout: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { user, tokens } = await authProvider.register(credentials);
          queryClient.clear();
          realtimeManager.setAuth(tokens.accessToken);
          set({ user, tokens, isLoading: false, isExplicitLogout: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          realtimeManager.cleanup();
          await authProvider.logout();
        } finally {
          queryClient.clear();
          useWorkspaceUiStore.getState().clearWorkspace();
          set({
            ...initialState,
            isInitialized: true,
            isExplicitLogout: true,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    },
  ),
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsExplicitLogout = () => useAuthStore((state) => state.isExplicitLogout);
