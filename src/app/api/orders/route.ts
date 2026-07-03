import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { ORDER_STATUSES } from "@/features/orders/types";
import { getOrdersDb, type DbOrder } from "@/mocks/orders";
import { simulateLatency } from "@/mocks/db";
import type { Paginated } from "@/types/api";

const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum([...ORDER_STATUSES, "all"]).optional(),
  sortBy: z.enum(["code", "total", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "orders:view");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const query = orderListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }

  const { page, pageSize, search, status, sortBy, sortOrder } = query.data;

  let orders = [...getOrdersDb().orders];

  if (search) {
    const needle = search.toLowerCase();
    orders = orders.filter(
      (order) =>
        order.code.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle) ||
        order.customerEmail.toLowerCase().includes(needle),
    );
  }
  if (status && status !== "all") {
    orders = orders.filter((order) => order.status === status);
  }

  orders.sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    const compared =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));
    return sortOrder === "asc" ? compared : -compared;
  });

  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = orders.slice((page - 1) * pageSize, page * pageSize);

  return jsonData<Paginated<DbOrder>>({ items, page, pageSize, total, totalPages });
}
