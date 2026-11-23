import { QueryClient } from '@tanstack/react-query';

import { ApiRequestError } from './api-client';

/** Создаёт QueryClient: повторяем только сетевые сбои, а не ошибки 4xx. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !(error instanceof ApiRequestError && error.status < 500) && failureCount < 2,
      },
    },
  });
}
