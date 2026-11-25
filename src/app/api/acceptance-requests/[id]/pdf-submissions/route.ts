import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-27 — các bản PDF đã xuất từ 1 phiếu (truy vết). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/acceptance-requests/${id}/pdf-submissions/`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
