import type { NextRequest } from "next/server";

import { jsonData, requireAuth } from "@/lib/api/server";
import { getNotificationsDb } from "@/mocks/notifications";
import { simulateLatency } from "@/mocks/db";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  await simulateLatency(200);

  const notifications = [...getNotificationsDb().notifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return jsonData({
    items: notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  });
}
