import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceRequest } from "@/entities/acceptance-request";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-13 — NT bổ sung & gửi lại phiếu bị 'Yêu cầu bổ sung' → về Chờ xác nhận. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const res = await callBackend<AcceptanceRequest>(
    `/acceptance-requests/${id}/resubmit/`,
    { method: "POST", body: body ?? {} },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
