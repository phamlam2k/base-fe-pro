import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { ConstructionLog } from "@/entities/construction-log";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-16 — TVGS trả nhật ký về NT chỉnh sửa (bắt buộc lý do). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.reason) {
    return jsonError(422, "VALIDATION_ERROR", "Bắt buộc nhập lý do.");
  }
  const res = await callBackend<ConstructionLog>(
    `/construction-logs/${id}/request-revision/`,
    { method: "POST", body: { reason: body.reason } },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
