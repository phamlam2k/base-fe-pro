import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { canTransition } from "@/features/orders/lib";
import { ORDER_STATUSES } from "@/features/orders/types";
import { getOrdersDb } from "@/mocks/orders";
import { simulateLatency } from "@/mocks/db";

type RouteParams = { params: Promise<{ id: string }> };

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

/** Advance the order through its state machine (see features/orders/lib.ts). */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orders:update");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const { id } = await params;
  const order = getOrdersDb().orders.find((candidate) => candidate.id === id);
  if (!order) {
    return jsonError(404, "NOT_FOUND", "Order not found.");
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid status.");
  }

  if (!canTransition(order.status, parsed.data.status)) {
    return jsonError(
      409,
      "INVALID_TRANSITION",
      `Cannot move an order from "${order.status}" to "${parsed.data.status}".`,
    );
  }

  order.status = parsed.data.status;
  order.timeline.push({
    status: parsed.data.status,
    at: new Date().toISOString(),
    by: auth.user.email,
  });

  return jsonData(order);
}
