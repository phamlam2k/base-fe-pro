import type { SessionUser } from "@/entities/session";
import type { User } from "@/entities/user";
import type { Paginated } from "@/shared/api/types";

/**
 * Test-data factories: every test builds ONLY the fields it cares about and
 * inherits sensible defaults for the rest. Never hand-write entity literals
 * in tests — when the type grows a field, only the factory changes.
 */

let sequence = 0;
const nextId = (prefix: string) => `${prefix}_${String(++sequence).padStart(3, "0")}`;

export function buildSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "usr_001",
    email: "admin@acme.io",
    name: "Ada Admin",
    role: "admin",
    ...overrides,
  };
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId("usr"),
    name: "Jane Cooper",
    email: "jane.cooper@example.com",
    phone: "",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

export function buildPaginated<T>(
  items: T[],
  overrides: Partial<Paginated<T>> = {},
): Paginated<T> {
  return {
    items,
    page: 1,
    pageSize: 10,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / 10)),
    ...overrides,
  };
}
