import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/** Danh sách ánh xạ loại chứng từ → biểu mẫu (theo công ty user quản + fallback nền tảng). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "pdf-forms:manage");
  if ("response" in auth) return auth.response;

  const res = await callBackend("/document-template-bindings/");
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data ?? []);
}

/** Gán/gỡ 1 ánh xạ. Body {documentType, templateId|null}. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "pdf-forms:manage");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const res = await callBackend("/document-template-bindings/", {
    method: "POST",
    body: body ?? {},
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data ?? null);
}
