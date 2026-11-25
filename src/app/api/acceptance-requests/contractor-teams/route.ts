import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { ContractorTeam } from "@/entities/acceptance-request";

/** Team Nhà thầu của user + TVGS phụ trách (người mời mặc định phiếu công việc). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const project = request.nextUrl.searchParams.get("project");
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  const res = await callBackend<ContractorTeam[]>(
    `/acceptance-requests/contractor-teams/${qs}`,
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data ?? []);
}
