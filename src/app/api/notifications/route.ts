import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { Notification } from "@/entities/notification";

type RawList = Notification[] | { results: Notification[] };

/** MAD-6 — danh sách thông báo của user (proxy → Django, scope theo user). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const project = request.nextUrl.searchParams.get("project");
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  const res = await callBackend<RawList>(`/notifications/${qs}`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  const items: Notification[] = Array.isArray(res.data)
    ? res.data
    : (res.data?.results ?? []);
  return jsonData(items);
}
