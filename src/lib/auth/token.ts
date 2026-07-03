import type { Role } from "@/config/permissions";

/**
 * Mock session token — a base64url-encoded JSON payload standing in for a
 * real JWT. Replace `encodeSessionToken`/`decodeSessionToken` with your
 * backend's JWT verification when integrating a real API; everything else
 * (proxy, session helpers, route handlers) stays untouched.
 */

export const AUTH_COOKIE = "base_fe_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  /** Unix epoch seconds. */
  exp: number;
}

export function encodeSessionToken(payload: SessionTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeSessionToken(
  token: string | undefined,
): SessionTokenPayload | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as SessionTokenPayload;
    if (!payload.sub || !payload.role) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
