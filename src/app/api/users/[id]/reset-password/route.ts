import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * MAD-36 — Admin reset mật khẩu người dùng. Proxy sang Django
 * `POST /users/{id}/reset-password/`, trả về mật khẩu mới tự sinh (hiện 1 lần).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, ["users:update", "companies:manage"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<{ id: string; generatedPassword: string }>(
    `/users/${id}/reset-password/`,
    { method: "POST" },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData({ generatedPassword: res.data.generatedPassword });
}
