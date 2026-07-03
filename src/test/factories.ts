import type { SessionUser } from "@/providers/session-provider";
import type { Order } from "@/features/orders";
import type { Product } from "@/features/products";
import type { User } from "@/features/users";
import type { Paginated } from "@/types/api";

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
    role: "viewer",
    status: "active",
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: nextId("prd"),
    name: "Aurora Headphones",
    sku: `SKU-${String(++sequence).padStart(3, "0")}`,
    category: "electronics",
    price: 129.99,
    stock: 42,
    status: "active",
    createdAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: nextId("ord"),
    code: `SO-${2600 + sequence}`,
    customerName: "Emma Johnson",
    customerEmail: "emma.johnson@example.com",
    status: "pending",
    total: 214.5,
    items: [
      { id: "itm_1", productName: "Aurora Headphones", quantity: 1, unitPrice: 214.5 },
    ],
    timeline: [{ status: "pending", at: "2026-02-01T00:00:00.000Z", by: "system" }],
    createdAt: "2026-02-01T00:00:00.000Z",
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
