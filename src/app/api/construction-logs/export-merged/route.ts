import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** Xuất GỘP nhiều nhật ký (mỗi nhật ký điền vào mẫu đã gán) → 1 PDF. Body {logIds}. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const res = await callBackend("/construction-logs/export-merged/", {
    method: "POST",
    body: body ?? {},
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
