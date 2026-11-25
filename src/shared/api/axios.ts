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

// Chống VÒNG LẶP đăng nhập: khi tài khoản đã bị xoá/khoá nhưng cookie phiên (JWT)
// vẫn còn hợp lệ về cấu trúc, proxy cứ bật /login ↔ /dashboard và mọi request 401 →
// reload liên tục ở trang chủ. Giải: (1) khi 401, XOÁ cookie phiên rồi mới về /login
// (proxy hết coi là đã đăng nhập); (2) giới hạn TỐI ĐA 3 lần rồi DỪNG để không lặp.
const AUTH_401_KEY = "auth401Count";
let handling401 = false;

apiClient.interceptors.response.use(
  (response) => {
    // Có request thành công → reset bộ đếm 401.
    if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_401_KEY);
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;

    // Bỏ qua chính request đăng nhập (401 do sai mật khẩu là hợp lệ) và khi đang ở
    // sẵn trang /login (tránh tự redirect vào chính nó).
    const isLoginCall = error.config?.url?.includes("/auth/login");
    const onLoginPage =
      typeof window !== "undefined" &&
      window.location.pathname === ROUTES.login;

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !isLoginCall &&
      !onLoginPage &&
      !handling401
    ) {
      const count = Number(sessionStorage.getItem(AUTH_401_KEY) ?? "0") + 1;
      sessionStorage.setItem(AUTH_401_KEY, String(count));
      if (count <= 3) {
        handling401 = true;
        void (async () => {
          // Xoá cookie phiên trước, rồi về /login → proxy không đẩy lại /dashboard.
          try {
            await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/logout`, {
              method: "POST",
            });
          } catch {
            // ignore — vẫn điều hướng về login
          }
          window.location.assign(
            `${ROUTES.login}?redirect=${encodeURIComponent(
              window.location.pathname,
            )}`,
          );
        })();
      }
      // count > 3: đã thử 3 lần → DỪNG (không redirect nữa) để cắt vòng lặp vô hạn.
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

/** Lý do lỗi do backend trả về (qua route BFF); lỗi mạng/timeout → null để dùng câu chung. */
export function backendErrorMessage(error: unknown): string | null {
  return error instanceof ApiError && error.code === "BACKEND_ERROR"
    ? error.message
    : null;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
