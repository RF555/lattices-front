import type { IAuthProvider } from './types';
import { JwtAuthProvider } from './providers/jwt-provider';
import { SupabaseAuthProvider } from './providers/supabase-provider';

export type * from './types';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- env var may be undefined at runtime
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || 'jwt';

function createAuthProvider(): IAuthProvider {
  switch (AUTH_PROVIDER) {
    case 'supabase':
      return new SupabaseAuthProvider();
    case 'jwt':
    default:
      return new JwtAuthProvider();
  }
}

export const authProvider = createAuthProvider();
