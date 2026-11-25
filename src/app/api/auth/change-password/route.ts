import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonError, requireAuth } from "@/shared/api/server";
import {
  AUTH_COOKIE,
  COOKIE_SECURE,
  SESSION_MAX_AGE_SECONDS,
  decodeSessionToken,
  encodeSessionToken,
} from "@/shared/lib/auth/token";
import type { ApiResponse } from "@/shared/api/types";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * MAD-36 — Người dùng tự đổi mật khẩu (ép đổi lần đầu / đổi thường ngày).
 * Proxy sang Django `/auth/change-password/`; nếu thành công, PHÁT HÀNH LẠI cookie
 * phiên với `mustChangePassword=false` để gate ở proxy.ts mở khoá ngay lập tức.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.");
  }

  const res = await callBackend("/auth/change-password/", {
    method: "POST",
    body: parsed.data, // camel→snake: currentPassword → current_password
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }

  const response = NextResponse.json<ApiResponse<{ ok: true }>>({
    data: { ok: true },
  });
  const payload = decodeSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (payload) {
    const newToken = encodeSessionToken({ ...payload, mustChangePassword: false });
    response.cookies.set(AUTH_COOKIE, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: COOKIE_SECURE,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
  return response;
}
