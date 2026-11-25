import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceRecordDetail } from "@/entities/acceptance-request";

type RouteParams = { params: Promise<{ id: string }> };

/** CĐT phủ quyết biên bản (backend chặn chỉ CĐT + lý do bắt buộc). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<AcceptanceRecordDetail>(
    `/acceptance-records/${id}/veto/`,
    { method: "POST", body: await request.json() },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
