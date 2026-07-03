import type { ListParams } from "@/types/api";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  at: string;
  by: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  createdAt: string;
}

export interface OrderListParams extends ListParams {
  status?: OrderStatus | "all";
  sortBy?: "code" | "total" | "createdAt";
}
