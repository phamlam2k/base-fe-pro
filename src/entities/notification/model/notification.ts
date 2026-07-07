/** Notification entity model. */
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
