import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Preview "Công tác nghiệm thu" lúc tạo nhật ký: biên bản Chấp thuận của team NT trong ngày. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:view");
  if ("response" in auth) return auth.response;

  const sp = request.nextUrl.searchParams;
  const team = sp.get("contractor_team");
  const date = sp.get("date");
  const params = new URLSearchParams();
  if (team) params.set("contractor_team", team);
  if (date) params.set("date", date);

  const res = await callBackend(`/construction-logs/daily-acceptance/?${params.toString()}`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
