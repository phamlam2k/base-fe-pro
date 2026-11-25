import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** Mẫu mặc định đã gán cho 1 loại chứng từ (mọi user — dùng cho xuất đơn lẻ). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const documentType = request.nextUrl.searchParams.get("documentType") ?? "";
  const res = await callBackend(
    `/document-template-bindings/resolve/?document_type=${encodeURIComponent(documentType)}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
