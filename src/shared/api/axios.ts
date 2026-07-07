import axios, { AxiosError } from "axios";

import type { ApiErrorBody } from "@/shared/api/types";
import { ROUTES } from "@/shared/config/routes";
import { env } from "@/shared/config/env";

/**
 * Normalized error thrown by every API call. Feature code catches ONE error
 * shape regardless of what the transport layer returned.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

/**
 * When a real backend issues bearer tokens, attach them here.
 * The mock API authenticates via an httpOnly cookie, sent automatically.
 */
apiClient.interceptors.request.use((config) => config);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;

    // Session expired mid-navigation: hard-redirect to login (skip the login
    // request itself, which legitimately returns 401 on bad credentials).
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (status === 401 && typeof window !== "undefined" && !isLoginCall) {
      window.location.assign(
        `${ROUTES.login}?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
    }

    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? (status === 0 ? "NETWORK_ERROR" : "UNKNOWN_ERROR"),
        body?.message ?? error.message,
        body?.details,
      ),
    );
  },
);

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
