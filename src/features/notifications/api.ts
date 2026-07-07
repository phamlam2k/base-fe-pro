import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPayload {
  items: Notification[];
  unreadCount: number;
}

export const notificationsApi = {
  async list(): Promise<NotificationsPayload> {
    const response =
      await apiClient.get<ApiResponse<NotificationsPayload>>("/notifications");
    return response.data.data;
  },

  async markAllRead(): Promise<void> {
    await apiClient.post("/notifications/read-all");
  },
};

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function notificationsOptions() {
  return queryOptions({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.list,
    // Lightweight polling — replace with SSE/WebSocket for real-time needs.
    refetchInterval: 30_000,
  });
}
