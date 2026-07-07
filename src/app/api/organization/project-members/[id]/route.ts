import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/project-members/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
