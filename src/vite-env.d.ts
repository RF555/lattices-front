/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_AUTH_PROVIDER: 'jwt' | 'supabase';
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
