import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { paginateFromDrf, type DrfList } from "@/shared/api/paginate";
import type { ConstructionLog } from "@/entities/construction-log";

/** MAD-10/16 — danh sách nhật ký thi công (scoped RBAC), lọc ?status + phân trang. */
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
  const res = await callBackend<DrfList<ConstructionLog>>(
    `/construction-logs/?${params.toString()}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(paginateFromDrf(res.data, page, pageSize));
}

/** MAD-10 — NT khai báo nhật ký. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.contractorTeam || !body?.logDate) {
    return jsonError(422, "VALIDATION_ERROR", "Thiếu team Nhà thầu hoặc ngày.");
  }
  const res = await callBackend<ConstructionLog>("/construction-logs/", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data, { status: 201 });
}
