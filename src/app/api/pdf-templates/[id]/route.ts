import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

// Route proxy động — không cache (dữ liệu mẫu PDF đổi theo DB).
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const { id } = await params;

  const res = await callBackend(`/pdf-templates/${id}/`, {
    preserveKeys: ["fields"],
  });
  if (!res.ok) {
    return jsonError(
      res.status || 502,
      "BACKEND_ERROR",
      backendErrorMessage(res.data),
    );
  }
  return jsonData(res.data);
}
