import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceRequest } from "@/entities/acceptance-request";

type RouteParams = { params: Promise<{ id: string }> };

/** TVGS dời thời gian nghiệm thu (proposedAt) khi phiếu chưa nghiệm thu xong. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.proposedAt) {
    return jsonError(422, "VALIDATION_ERROR", "Cần chọn thời gian nghiệm thu mới.");
  }
  const res = await callBackend<AcceptanceRequest>(
    `/acceptance-requests/${id}/reschedule/`,
    { method: "POST", body: { proposedAt: body.proposedAt, reason: body.reason ?? "" } },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
