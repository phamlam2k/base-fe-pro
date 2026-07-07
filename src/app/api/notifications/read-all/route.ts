import type { NextRequest } from "next/server";

import { jsonData, requireAuth } from "@/shared/api/server";
import { getNotificationsDb } from "@/mocks/notifications";
import { simulateLatency } from "@/mocks/db";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  await simulateLatency(200);

  getNotificationsDb().notifications.forEach((notification) => {
    notification.read = true;
  });

  return jsonData(null);
}
