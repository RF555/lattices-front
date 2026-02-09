/**
 * Tests for QueryProvider Component
 *
 * Tests the React Query provider with persistence that wraps the application.
 * Verifies correct provider usage and children rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider } from '../QueryProvider';

// Mock TanStack Query persist client
vi.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: vi.fn(({ children }) => (
    <div data-testid="persist-provider">{children}</div>
  )),
}));

// Mock async storage persister
vi.mock('@tanstack/query-async-storage-persister', () => ({
  createAsyncStoragePersister: vi.fn(() => ({ some: 'persister' })),
}));

// Mock devtools
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: vi.fn(() => null),
}));

// Mock queryClient
vi.mock('../queryClient', () => ({
  queryClient: { some: 'queryClient' },
}));

// Mock constants
vi.mock('@/constants', () => ({
  STORAGE_KEYS: {
    QUERY_CACHE: 'lattices-query-cache',
  },
}));

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>Test Child</div>
      </QueryProvider>,
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should use PersistQueryClientProvider', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>,
    );

    expect(screen.getByTestId('persist-provider')).toBeInTheDocument();
    expect(PersistQueryClientProvider).toHaveBeenCalled();
  });

  it('should pass queryClient to PersistQueryClientProvider', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>,
    );

    expect(PersistQueryClientProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        client: { some: 'queryClient' },
      }),
      expect.anything(),
    );
  });

  it('should pass persistOptions with persister to PersistQueryClientProvider', () => {
    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>,
    );

    expect(PersistQueryClientProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        persistOptions: expect.objectContaining({
          persister: { some: 'persister' },
        }),
      }),
      expect.anything(),
    );
  });
});
