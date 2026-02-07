import {
  createClient,
  type SupabaseClient,
  type AuthUser,
  type AuthSession,
} from '@supabase/supabase-js';
import type {
  IAuthProvider,
  User,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
} from '../types';

/**
 * Supabase auth provider — calls Supabase Auth directly from the frontend.
 * Used when VITE_AUTH_PROVIDER=supabase.
 */
export class SupabaseAuthProvider implements IAuthProvider {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Supabase createClient generic inference mismatch
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive: Supabase may return null user/session on auth failure
    if (error || !data.user || !data.session) {
      throw new Error(error?.message ?? 'Login failed');
    }

    return {
      user: this.mapUser(data.user),
      tokens: this.mapTokens(data.session),
    };
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { data, error } = await this.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          display_name: credentials.name,
          name: credentials.name,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Registration failed');
    }

    // No session means email confirmation is required
    if (!data.session) {
      throw new Error('Please check your email to confirm your account');
    }

    return {
      user: this.mapUser(data.user),
      tokens: this.mapTokens(data.session),
    };
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
  }

  async refreshToken(): Promise<AuthTokens> {
    const { data, error } = await this.client.auth.refreshSession();

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Token refresh failed');
    }

    return this.mapTokens(data.session);
  }

  async getSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
    const { data } = await this.client.auth.getSession();

    if (!data.session?.user) {
      return null;
    }

    return {
      user: this.mapUser(data.session.user),
      tokens: this.mapTokens(data.session),
    };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async loginWithOAuth(provider: string): Promise<void> {
    await this.client.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  private mapUser(supabaseUser: AuthUser): User {
    const metadata = supabaseUser.user_metadata as Record<string, unknown> | undefined;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name:
        (metadata?.display_name as string | undefined) ?? (metadata?.name as string | undefined),
      avatarUrl: metadata?.avatar_url as string | undefined,
      createdAt: supabaseUser.created_at,
    };
  }

  private mapTokens(session: AuthSession): AuthTokens {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : undefined,
    };
  }
}
