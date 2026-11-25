import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { backendUrl } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";

type RouteParams = { params: Promise<{ id: string }> };

async function accessToken(): Promise<string | undefined> {
  const store = await cookies();
  return decodeSessionToken(store.get(AUTH_COOKIE)?.value)?.access;
}

/** MAD-8 — chuyển tiếp hóa đơn PDF (multipart) sang Django. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const token = await accessToken();
  // BUFFER body → fetch tự đặt Content-Length (stream RAW không có → Django parse hụt).
  const body = await request.arrayBuffer();
  const res = await fetch(backendUrl(`/acceptance-requests/${id}/invoice/`), {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": request.headers.get("content-type") ?? "",
    },
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.error?.message)) || "Tải hóa đơn lên thất bại.";
    return jsonError(res.status || 502, "BACKEND_ERROR", detail);
  }
  return jsonData(data);
}
