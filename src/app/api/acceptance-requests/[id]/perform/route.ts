import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

/** MAD-14 — TVGS nghiệm thu hiện trường (Chấp thuận/Khắc phục/Từ chối). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const res = await callBackend<{ recordCode: string | null }>(
    `/acceptance-requests/${id}/perform/`,
    { method: "POST", body: body ?? {} },
  );
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data, { status: 201 });
}
