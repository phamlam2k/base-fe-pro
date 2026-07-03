import "server-only";

import type {
  OrderStatus,
  Order as OrderShape,
} from "@/features/orders/types";

/** In-memory orders table. The Order type is shared with the FE contract. */
export type DbOrder = OrderShape;

const CUSTOMERS = [
  ["Emma Johnson", "emma.johnson@example.com"],
  ["Minh Tran", "minh.tran@example.com"],
  ["Lucas Garcia", "lucas.garcia@example.com"],
  ["Thao Pham", "thao.pham@example.com"],
  ["Olivia Brown", "olivia.brown@example.com"],
  ["Khanh Le", "khanh.le@example.com"],
  ["Noah Smith", "noah.smith@example.com"],
  ["Linh Hoang", "linh.hoang@example.com"],
] as const;

const PRODUCT_NAMES = [
  "Aurora Headphones", "Nimbus Backpack", "Vertex Lamp", "Echo Sneakers",
  "Zenith Serum", "Pulse Keyboard", "Orbit Bottle", "Nova Jacket",
] as const;

const STATUS_CYCLE: OrderStatus[] = [
  "pending", "processing", "shipped", "delivered", "delivered",
  "processing", "cancelled", "pending", "shipped", "delivered",
];

const SEED_BASE_MS = Date.UTC(2026, 5, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function seedOrders(): DbOrder[] {
  return Array.from({ length: 32 }, (_, i) => {
    const [customerName, customerEmail] = CUSTOMERS[(i * 3 + 1) % CUSTOMERS.length];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const createdAtMs = SEED_BASE_MS - Math.round(i * 2.7 * DAY_MS);

    const itemCount = (i % 3) + 1;
    const items = Array.from({ length: itemCount }, (_, j) => {
      const unitPrice = Math.round((25 + ((i * 31 + j * 17) % 320)) * 100) / 100;
      return {
        id: `itm_${i}_${j}`,
        productName: PRODUCT_NAMES[(i * 5 + j * 3) % PRODUCT_NAMES.length],
        quantity: (j + i) % 4 + 1,
        unitPrice,
      };
    });
    const total =
      Math.round(
        items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100,
      ) / 100;

    // Timeline: one entry per status reached, spaced a day apart.
    const path: OrderStatus[] =
      status === "cancelled"
        ? ["pending", "cancelled"]
        : (["pending", "processing", "shipped", "delivered"] as OrderStatus[]).slice(
            0,
            ["pending", "processing", "shipped", "delivered"].indexOf(status) + 1,
          );
    const timeline = path.map((entry, index) => ({
      status: entry,
      at: new Date(createdAtMs + index * DAY_MS).toISOString(),
      by: index === 0 ? "system" : "manager@acme.io",
    }));

    return {
      id: `ord_${String(i + 1).padStart(3, "0")}`,
      code: `SO-${String(2600 + i)}`,
      customerName,
      customerEmail,
      status,
      total,
      items,
      timeline,
      createdAt: new Date(createdAtMs).toISOString(),
    };
  });
}

const globalStore = globalThis as unknown as { __mockOrders?: { orders: DbOrder[] } };

export function getOrdersDb(): { orders: DbOrder[] } {
  if (!globalStore.__mockOrders) {
    globalStore.__mockOrders = { orders: seedOrders() };
  }
  return globalStore.__mockOrders;
}
