import "server-only";

import { cookies } from "next/headers";

import type { Role } from "@/shared/config/permissions";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";

/** The authenticated user as seen by layouts/pages/route handlers. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Read the current user from the session cookie. Server-side only.
 * Returns `null` when unauthenticated — callers decide whether to redirect.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const payload = decodeSessionToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}
