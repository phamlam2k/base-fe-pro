import "server-only";

export interface DbNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const SEED_BASE_MS = Date.UTC(2026, 5, 30, 9);
const HOUR_MS = 60 * 60 * 1000;

const SEED: Array<[string, string]> = [
  ["New order received", "SO-2601 was placed by Emma Johnson ($214.50)."],
  ["Low stock warning", "Aurora Headphones has only 3 units left."],
  ["User invited", "manager@acme.io invited thao.pham@example.com."],
  ["Order delivered", "SO-2590 was delivered to Minh Tran."],
  ["Weekly report ready", "Your analytics report for week 26 is available."],
  ["Payment failed", "Payment for SO-2598 was declined — retry scheduled."],
  ["New comment", "Khanh Le commented on product Nimbus Backpack."],
  ["System maintenance", "Scheduled maintenance on Sunday 02:00–03:00 UTC."],
];

function seedNotifications(): DbNotification[] {
  return SEED.map(([title, body], i) => ({
    id: `ntf_${String(i + 1).padStart(3, "0")}`,
    title,
    body,
    read: i > 2,
    createdAt: new Date(SEED_BASE_MS - i * 7 * HOUR_MS).toISOString(),
  }));
}

const globalStore = globalThis as unknown as {
  __mockNotifications?: { notifications: DbNotification[] };
};

export function getNotificationsDb(): { notifications: DbNotification[] } {
  if (!globalStore.__mockNotifications) {
    globalStore.__mockNotifications = { notifications: seedNotifications() };
  }
  return globalStore.__mockNotifications;
}
