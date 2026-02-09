import { QueryClient } from '@tanstack/react-query';
import { ApiException } from '@lib/api/errors';
import { QUERY_CACHE } from '@/constants';
import { HTTP_STATUS } from '@/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CACHE.STALE_LONG,
      gcTime: QUERY_CACHE.GC_DEFAULT,
      networkMode: 'offlineFirst',
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (
          ApiException.isApiException(error) &&
          error.status >= HTTP_STATUS.BAD_REQUEST &&
          error.status < HTTP_STATUS.SERVER_ERROR
        ) {
          return false;
        }
        return failureCount < QUERY_CACHE.DEFAULT_RETRY;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
