import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-6 — đánh dấu 1 thông báo đã đọc (proxy → Django). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/notifications/${id}/read/`, { method: "POST" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
