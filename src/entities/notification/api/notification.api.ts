import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type { NotificationsPayload } from "@/entities/notification/model/notification";

/** Raw HTTP calls for the Notification entity. */
export const notificationApi = {
  list: async (): Promise<NotificationsPayload> => {
    const res = await apiClient.get<ApiResponse<NotificationsPayload>>("/notifications");
    return res.data.data;
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.post("/notifications/read-all");
  },
};
