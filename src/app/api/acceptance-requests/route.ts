import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { paginateFromDrf, type DrfList } from "@/shared/api/paginate";
import type { AcceptanceRequest } from "@/entities/acceptance-request";

/** MAD-12 — danh sách phiếu nghiệm thu (scoped RBAC ở backend), lọc ?status + phân trang. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const page = Number(sp.get("page")) || 1;
  const pageSize = Number(sp.get("pageSize")) || 10;
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  const project = sp.get("project");
  if (project) params.set("project", project);
  const res = await callBackend<DrfList<AcceptanceRequest>>(
    `/acceptance-requests/?${params.toString()}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(paginateFromDrf(res.data, page, pageSize));
}

/**
 * MAD-8/9 — Tạo phiếu yêu cầu nghiệm thu. Nhận body camelCase, callBackend tự
 * chuyển snake_case cho Django `/acceptance-requests/`.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.contractorTeam || !body?.type) {
    return jsonError(422, "VALIDATION_ERROR", "Thiếu loại phiếu hoặc team Nhà thầu.");
  }

  const res = await callBackend<AcceptanceRequest>("/acceptance-requests/", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data, { status: 201 });
}
