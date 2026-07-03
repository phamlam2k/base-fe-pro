import type { OrderStatus } from "@/features/orders/types";

/**
 * Order status state machine. Pure module — shared by the mock API
 * (server-side validation) and the UI (which actions to render), and unit
 * tested in lib.test.ts.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to);
}

export function isTerminal(status: OrderStatus): boolean {
  return nextStatuses(status).length === 0;
}
