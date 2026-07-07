import { queryOptions } from "@tanstack/react-query";

import { notificationApi } from "@/entities/notification/api/notification.api";

/** React-query query-options factory for the Notification entity. */
export const notificationQueries = {
  all: () => ["notification"] as const,

  list: () =>
    queryOptions({
      queryKey: [...notificationQueries.all(), "list"],
      queryFn: notificationApi.list,
      // Lightweight polling — replace with SSE/WebSocket for real-time needs.
      refetchInterval: 30_000,
    }),
};
