import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api/server";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  encodeSessionToken,
} from "@/lib/auth/token";
import { DEMO_PASSWORD, getDb, simulateLatency } from "@/mocks/db";
import type { ApiResponse } from "@/types/api";
import type { SessionUser } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  await simulateLatency();

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid email or password.");
  }

  const { email, password } = parsed.data;
  const user = getDb().users.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
  );

  // Mock rule: any seeded user + the shared demo password.
  if (!user || password !== DEMO_PASSWORD) {
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }
  if (user.status === "suspended") {
    return jsonError(403, "ACCOUNT_SUSPENDED", "This account is suspended.");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = encodeSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.json<ApiResponse<SessionUser>>({
    data: sessionUser,
  });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
