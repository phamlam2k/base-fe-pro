import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type { Notification } from "@/entities/notification/model/notification";

/** Raw HTTP calls for the Notification entity (proxy → Django). */
export const notificationApi = {
  /** Danh sách thông báo của user (tải khi mở dropdown). */
  list: async (projectId?: string): Promise<Notification[]> => {
    const res = await apiClient.get<ApiResponse<Notification[]>>("/notifications", {
      params: { ...(projectId ? { project: projectId } : {}) },
    });
    return res.data.data;
  },
  /** Số chưa đọc — endpoint nhẹ để poll (theo dự án đang chọn). */
  unreadCount: async (projectId?: string): Promise<number> => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>(
      "/notifications/unread-count",
      { params: { ...(projectId ? { project: projectId } : {}) } },
    );
    return res.data.data.count;
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.post("/notifications/read-all");
  },
  /** Đánh dấu đã đọc 1 thông báo (khi bấm vào). */
  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },
};
