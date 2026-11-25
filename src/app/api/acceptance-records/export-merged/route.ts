import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** Xuất GỘP nhiều biên bản (tự chọn mẫu theo loại) → 1 PDF. Body {recordIds}. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const res = await callBackend("/acceptance-records/export-merged/", {
    method: "POST",
    body: body ?? {},
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
