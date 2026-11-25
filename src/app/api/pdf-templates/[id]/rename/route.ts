import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

type RouteParams = { params: Promise<{ id: string }> };

/** Sửa tên/mô tả biểu mẫu PDF (backend chặn theo quyền quản lý mẫu). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "pdf-forms:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/pdf-templates/${id}/rename/`, {
    method: "POST",
    body: await request.json(),
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data);
}
