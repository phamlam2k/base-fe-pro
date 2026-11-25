/** Public API of the `notification` entity (FSD). */
export { notificationApi } from "./api/notification.api";
export { notificationQueries } from "./api/notification.queries";
export type {
  Notification,
  NotificationsPayload,
  NotificationTarget,
} from "./model/notification";
export { resolveNotificationHref } from "./lib/resolve-notification-href";
