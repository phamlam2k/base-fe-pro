import { NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/auth/token";
import type { ApiResponse } from "@/types/api";

export async function POST() {
  const response = NextResponse.json<ApiResponse<null>>({ data: null });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
