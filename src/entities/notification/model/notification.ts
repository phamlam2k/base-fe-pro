/** Target ngữ nghĩa để deep-link (độc lập nền tảng). */
export interface NotificationTarget {
  type: string; // 'acceptance_request' | 'construction_log' | ...
  id: string;
  data?: Record<string, unknown>;
}

/** Notification entity model. */
export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  target: NotificationTarget | null;
  /** Tên dự án của thông báo (null nếu là thông báo hệ thống). */
  projectName: string | null;
  /** ID dự án — để tự đổi dự án đang chọn khi bấm thông báo của dự án khác. */
  projectId: string | null;
  createdAt: string;
}

export interface NotificationsPayload {
  items: Notification[];
  unreadCount: number;
}
