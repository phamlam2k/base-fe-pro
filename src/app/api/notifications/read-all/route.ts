import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** MAD-6 — đánh dấu tất cả đã đọc (proxy → Django). */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const res = await callBackend("/notifications/mark-all-read/", { method: "POST" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
