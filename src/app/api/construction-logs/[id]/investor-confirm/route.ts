import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { ConstructionLog } from "@/entities/construction-log";

type RouteParams = { params: Promise<{ id: string }> };

/** CĐT nhận xét + XÁC NHẬN nhật ký (tuỳ chọn). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const res = await callBackend<ConstructionLog>(
    `/construction-logs/${id}/investor-confirm/`,
    { method: "POST", body: body ?? {} },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
