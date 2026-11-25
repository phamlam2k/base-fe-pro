import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type CatalogSection = { group: string; keys: Array<{ key: string; label: string }> };

/** Danh mục khoá nhật ký (gom nhóm) cho dropdown 'Tự điền dữ liệu' của builder mẫu PDF. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const res = await callBackend<CatalogSection[]>("/construction-logs/prefill-catalog/");
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
