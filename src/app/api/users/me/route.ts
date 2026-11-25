import type { NextRequest } from "next/server";
import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;
  const res = await callBackend("/auth/me/");
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  return jsonData(res.data);
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;
  const body = await request.json();
  const res = await callBackend("/auth/me/", { method: "PATCH", body });
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  return jsonData(res.data);
}
