import "server-only";

import type { Role } from "@/config/permissions";

/**
 * In-memory mock database backing the /api route handlers.
 *
 * - Seeded deterministically so every developer sees the same data.
 * - Stored on `globalThis` so it survives HMR recompiles in dev.
 * - Mutations (create/update/delete) persist until the server restarts.
 *
 * Replace the route handlers in `src/app/api` with a real backend when
 * ready — the feature layer only talks to the HTTP contract.
 */

export type UserStatus = "active" | "invited" | "suspended";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string; // ISO date
}

/** All demo accounts share this password (mock only, obviously). */
export const DEMO_PASSWORD = "Demo@123";

const FIRST_NAMES = [
  "Liam", "Emma", "Noah", "Olivia", "Ethan", "Ava", "Lucas", "Mia",
  "Mason", "Sophia", "Logan", "Isabella", "James", "Amelia", "Henry",
  "Harper", "Minh", "Linh", "An", "Khanh", "Bao", "Thao", "Duc", "Trang",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Nguyen", "Tran",
  "Pham", "Le", "Hoang", "Garcia", "Martinez",
];

/** Fixed epoch so the seed is stable across restarts. */
const SEED_BASE_MS = Date.UTC(2026, 5, 30); // 2026-06-30
const DAY_MS = 24 * 60 * 60 * 1000;

function seedUsers(): DbUser[] {
  const demoAccounts: DbUser[] = [
    {
      id: "usr_001",
      name: "Ada Admin",
      email: "admin@acme.io",
      role: "admin",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 400 * DAY_MS).toISOString(),
    },
    {
      id: "usr_002",
      name: "Morgan Manager",
      email: "manager@acme.io",
      role: "manager",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 320 * DAY_MS).toISOString(),
    },
    {
      id: "usr_003",
      name: "Vera Viewer",
      email: "viewer@acme.io",
      role: "viewer",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 250 * DAY_MS).toISOString(),
    },
  ];

  const generated: DbUser[] = Array.from({ length: 44 }, (_, i) => {
    const first = FIRST_NAMES[(i * 7 + 3) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 5 + 1) % LAST_NAMES.length];
    const role: Role = i % 11 === 0 ? "admin" : i % 3 === 0 ? "manager" : "viewer";
    const status: UserStatus =
      i % 13 === 0 ? "suspended" : i % 5 === 0 ? "invited" : "active";

    return {
      id: `usr_${String(i + 4).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      role,
      status,
      // Spread signups over ~11 months, denser toward the present.
      createdAt: new Date(
        SEED_BASE_MS - Math.round((i * 7.3 + (i % 5) * 1.7) * DAY_MS),
      ).toISOString(),
    };
  });

  return [...demoAccounts, ...generated];
}

interface MockDb {
  users: DbUser[];
  nextId: number;
}

const globalStore = globalThis as unknown as { __mockDb?: MockDb };

export function getDb(): MockDb {
  if (!globalStore.__mockDb) {
    const users = seedUsers();
    globalStore.__mockDb = { users, nextId: users.length + 1 };
  }
  return globalStore.__mockDb;
}

export function allocateUserId(): string {
  const db = getDb();
  return `usr_${String(db.nextId++).padStart(3, "0")}`;
}

/** Simulated network latency so loading states are visible in dev. */
export function simulateLatency(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
