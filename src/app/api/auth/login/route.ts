import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { jsonError } from "@/shared/api/server";
import { callBackend } from "@/shared/api/backend";
import { platformRoleToAppRole } from "@/shared/lib/auth/roles";
import {
  AUTH_COOKIE,
  COOKIE_SECURE,
  SESSION_MAX_AGE_SECONDS,
  encodeSessionToken,
} from "@/shared/lib/auth/token";
import type { ApiResponse } from "@/shared/api/types";
import type { SessionUser } from "@/shared/lib/auth/session";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

interface TokenPair {
  access?: string;
  refresh?: string;
}

interface MeResponse {
  id: string;
  email: string;
  fullName?: string;
  platformRole?: string;
  role?: string; // vai trò nghiệp vụ Madoka (AccountRole)
  mustChangePassword?: boolean;
}

/**
 * Real login: exchange email+password for a Django JWT, fetch the profile,
 * then store both tokens + the mapped role in an httpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid email or password.");
  }

  // 1. Obtain the JWT pair (SimpleJWT's TokenObtainPairView uses email+password).
  const tokenRes = await callBackend<TokenPair>("/auth/token/", {
    method: "POST",
    body: parsed.data,
    anonymous: true,
  });
  if (!tokenRes.ok || !tokenRes.data?.access || !tokenRes.data?.refresh) {
    if (tokenRes.status === 0) {
      return jsonError(502, "BACKEND_UNREACHABLE", "Cannot reach the server.");
    }
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }
  const { access, refresh } = tokenRes.data;

  // 2. Fetch the profile (identity + platform role) with the fresh access token.
  const meRes = await callBackend<MeResponse>("/auth/me/", {
    accessToken: access,
  });
  if (!meRes.ok || !meRes.data?.id) {
    return jsonError(401, "INVALID_CREDENTIALS", "Could not load your profile.");
  }

  const role = platformRoleToAppRole(meRes.data.platformRole);
  const sessionUser: SessionUser = {
    id: meRes.data.id,
    email: meRes.data.email,
    name: meRes.data.fullName || meRes.data.email,
    role,
    madokaRole: meRes.data.role ?? "",
    mustChangePassword: meRes.data.mustChangePassword ?? false,
  };

  const token = encodeSessionToken({
    sub: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role,
    madokaRole: sessionUser.madokaRole,
    mustChangePassword: sessionUser.mustChangePassword,
    access,
    refresh,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.json<ApiResponse<SessionUser>>({
    data: sessionUser,
  });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
