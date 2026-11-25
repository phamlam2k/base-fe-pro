import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceRequest } from "@/entities/acceptance-request";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-13 — chi tiết 1 phiếu (kèm events + sampling task). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<AcceptanceRequest>(`/acceptance-requests/${id}/`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
