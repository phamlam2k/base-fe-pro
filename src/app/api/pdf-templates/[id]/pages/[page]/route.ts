import type { NextRequest } from "next/server";

import { backendUrl } from "@/shared/api/backend";
import { jsonError, requireAuth } from "@/shared/api/server";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";

type RouteParams = { params: Promise<{ id: string; page: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const session = decodeSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!session) {
    return jsonError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  const { id, page } = await params;

  const djangoRes = await fetch(
    backendUrl(`/pdf-templates/${id}/pages/${page}/`),
    {
      headers: {
        Authorization: `Bearer ${session.access}`,
      },
      cache: "no-store",
    },
  );

  if (!djangoRes.ok) {
    return jsonError(djangoRes.status, "BACKEND_ERROR", "Failed to render page");
  }

  return new Response(await djangoRes.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
