/* eslint-disable react-refresh/only-export-components */
/**
 * Test Utilities
 *
 * Custom render function that wraps components with necessary providers:
 * - QueryClientProvider (with test-specific QueryClient)
 * - MemoryRouter (for components using React Router hooks)
 *
 * Usage:
 *   import { render, screen } from '@/test/test-utils'
 *   render(<MyComponent />)
 */

import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';

/**
 * Creates a test-specific QueryClient with:
 * - No retries (tests should be deterministic)
 * - No caching (each test starts fresh)
 * - Immediate garbage collection
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 */
function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
  routerProps = {},
}: AllTheProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter {...routerProps}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

/**
 * Custom render function that wraps components with providers
 *
 * @example
 * // Basic usage
 * render(<MyComponent />)
 *
 * @example
 * // With custom QueryClient
 * const queryClient = createTestQueryClient()
 * render(<MyComponent />, { queryClient })
 *
 * @example
 * // With initial route
 * render(<MyComponent />, { routerProps: { initialEntries: ['/todos/123'] } })
 */
function customRender(
  ui: ReactElement,
  { queryClient, routerProps, ...options }: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} routerProps={routerProps}>
        {children}
      </AllTheProviders>
    ),
    ...options,
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom implementation
export { customRender as render };
