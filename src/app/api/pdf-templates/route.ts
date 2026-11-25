import type { NextRequest } from "next/server";

import {
  backendErrorMessage,
  backendUrl,
  callBackend,
  camelize,
  toArray,
} from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const res = await callBackend("/pdf-templates/", {
    preserveKeys: ["fields"],
  });
  if (!res.ok) {
    return jsonError(
      res.status || 502,
      "BACKEND_ERROR",
      backendErrorMessage(res.data),
    );
  }
  return jsonData(toArray(res.data));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "pdf-forms:manage");
  if ("response" in auth) return auth.response;

  const session = decodeSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!session) {
    return jsonError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  const formData = await request.formData();

  const djangoRes = await fetch(backendUrl("/pdf-templates/"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access}`,
    },
    body: formData,
    cache: "no-store",
  });

  const text = await djangoRes.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }

  if (!djangoRes.ok) {
    return jsonError(
      djangoRes.status || 502,
      "BACKEND_ERROR",
      backendErrorMessage(data),
    );
  }

  return jsonData(camelize(data, new Set(["fields"])), { status: 201 });
}
