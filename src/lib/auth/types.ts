export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  register(credentials: RegisterCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  getSession(): Promise<{ user: User; tokens: AuthTokens } | null>;
  resetPassword(email: string): Promise<void>;
  loginWithOAuth?(provider: string): Promise<void>;
  handleOAuthCallback?(code: string): Promise<{ user: User; tokens: AuthTokens }>;
}
