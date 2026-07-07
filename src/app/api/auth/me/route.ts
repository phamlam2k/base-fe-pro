import type { NextRequest } from "next/server";

import { jsonData, requireAuth } from "@/shared/api/server";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;
  return jsonData(auth.user);
}
