import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

// Không để Next cache response — dữ liệu nhật ký thay đổi theo thời gian.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: Promise<{ id: string }> };

/** Giá trị khoá dữ liệu của 1 nhật ký (map vào dataKey mẫu PDF). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend<Record<string, string>>(
    `/construction-logs/${id}/prefill-fields/`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
