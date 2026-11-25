import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { ConstructionLog } from "@/entities/construction-log";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-16 — chi tiết nhật ký (kèm "nghiệm thu trong ngày" tự động). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<ConstructionLog>(`/construction-logs/${id}/`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
