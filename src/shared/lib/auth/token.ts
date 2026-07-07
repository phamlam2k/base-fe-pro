import type { Role } from "@/shared/config/permissions";

/**
 * Session cookie payload. It carries the identity + coarse role used for
 * routing/UI gating AND the Django JWTs (access + refresh). The cookie is
 * httpOnly, so the tokens never reach client JavaScript — the server-side
 * `lib/api/backend.ts` reads them to call Django on the browser's behalf.
 */

export const AUTH_COOKIE = "base_fe_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  /** Django JWT access token (short-lived). */
  access: string;
  /** Django JWT refresh token (rotated on refresh). */
  refresh: string;
  /** Unix epoch seconds — cookie lifetime, not the JWT's own exp. */
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
