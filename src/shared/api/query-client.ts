import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "@/shared/api/axios";

/**
 * One place to define caching/retry policy for the whole app.
 * Feature hooks may override per-query, but should have a reason to.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Client errors (4xx) will not succeed on retry.
          if (isApiError(error) && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
