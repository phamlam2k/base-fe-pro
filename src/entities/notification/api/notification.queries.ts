import { queryOptions } from "@tanstack/react-query";

import { notificationApi } from "@/entities/notification/api/notification.api";

/** React-query query-options factory for the Notification entity. */
export const notificationQueries = {
  all: () => ["notification"] as const,

  /** Poll nhẹ số chưa đọc (~25s), theo dự án đang chọn. */
  unreadCount: (projectId?: string) =>
    queryOptions({
      queryKey: [...notificationQueries.all(), "unread-count", projectId ?? null],
      queryFn: () => notificationApi.unreadCount(projectId),
      refetchInterval: 25_000,
    }),

  /** Danh sách đầy đủ theo dự án — chỉ tải khi mở dropdown (enabled ở component). */
  list: (projectId?: string) =>
    queryOptions({
      queryKey: [...notificationQueries.all(), "list", projectId ?? null],
      queryFn: () => notificationApi.list(projectId),
    }),
};
