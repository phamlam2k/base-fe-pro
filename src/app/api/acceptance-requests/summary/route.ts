import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { AcceptanceSummary } from "@/entities/acceptance-request";

/** MAD-5 — KPI tổng hợp phiếu nghiệm thu (scoped RBAC ở backend). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const project = request.nextUrl.searchParams.get("project");
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  const res = await callBackend<AcceptanceSummary>(
    `/acceptance-requests/summary/${qs}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
