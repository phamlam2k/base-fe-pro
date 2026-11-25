import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** MAD-6 — số thông báo chưa đọc (endpoint nhẹ để poll). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const project = request.nextUrl.searchParams.get("project");
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  const res = await callBackend<{ count: number }>(`/notifications/unread-count/${qs}`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData({ count: res.data?.count ?? 0 });
}
