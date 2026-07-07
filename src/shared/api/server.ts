import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { can, type Permission } from "@/shared/config/permissions";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";
import type { SessionUser } from "@/shared/lib/auth/session";
import type { ApiErrorBody, ApiResponse } from "@/shared/api/types";

/** Helpers shared by all mock route handlers: consistent envelopes + auth. */

export function jsonData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ data }, init);
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, details } },
    { status },
  );
}

/**
 * Authenticate the request and (optionally) authorize a permission.
 * Returns the user or a ready-to-return error response.
 */
export function requireAuth(
  request: NextRequest,
  permission?: Permission,
): { user: SessionUser } | { response: NextResponse } {
  const payload = decodeSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (!payload) {
    return {
      response: jsonError(401, "UNAUTHENTICATED", "Authentication required."),
    };
  }
  if (permission && !can(payload.role, permission)) {
    return {
      response: jsonError(
        403,
        "FORBIDDEN",
        `Missing permission: ${permission}`,
      ),
    };
  }
  return {
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
  };
}
