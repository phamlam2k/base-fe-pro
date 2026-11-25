import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { paginateFromDrf, type DrfList } from "@/shared/api/paginate";
import type { AcceptanceRecord } from "@/entities/acceptance-request";

/** MAD-11 — danh sách biên bản nghiệm thu (scoped RBAC ở backend) + phân trang. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get("page")) || 1;
  const pageSize = Number(sp.get("pageSize")) || 10;
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const project = sp.get("project");
  if (project) params.set("project", project);
  const res = await callBackend<DrfList<AcceptanceRecord>>(
    `/acceptance-records/?${params.toString()}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(paginateFromDrf(res.data, page, pageSize));
}
