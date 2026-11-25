import type { NextRequest } from "next/server";

import { fetchWithSession } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/**
 * Upload-ngay: chuyển tiếp multipart (nhiều file ảnh/PDF) sang Django
 * `/acceptance-uploads/` → trả `{ files: [{ key, url, name, is_image, is_pdf }] }`.
 * Client giữ `key` để gắn vào phiếu khi tạo / nghiệm thu.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "acceptance:create");
  if ("response" in auth) return auth.response;

  // BUFFER body (arrayBuffer) rồi forward → fetch tự đặt Content-Length. KHÔNG stream
  // RAW (duplex:half) vì stream không có Content-Length → dùng chunked transfer, Django
  // (WSGI/gunicorn) parse multipart hụt → 0 file → 400 "Chưa chọn file".
  const body = await request.arrayBuffer();
  const res = await fetchWithSession("/acceptance-uploads/", {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.error?.message)) || "Tải tệp lên thất bại.";
    return jsonError(res.status || 502, "BACKEND_ERROR", detail);
  }
  return jsonData(data, { status: 201 });
}
