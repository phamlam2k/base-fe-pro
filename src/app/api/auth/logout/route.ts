import { NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/shared/lib/auth/token";
import type { ApiResponse } from "@/shared/api/types";

export async function POST() {
  const response = NextResponse.json<ApiResponse<null>>({ data: null });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
