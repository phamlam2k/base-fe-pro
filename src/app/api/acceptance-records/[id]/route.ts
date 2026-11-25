import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceRecordDetail } from "@/entities/acceptance-request";

type RouteParams = { params: Promise<{ id: string }> };

/** Chi tiết 1 biên bản nghiệm thu (ảnh hiện trường, xác nhận 2 bên, phủ quyết). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<AcceptanceRecordDetail>(
    `/acceptance-records/${id}/`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
