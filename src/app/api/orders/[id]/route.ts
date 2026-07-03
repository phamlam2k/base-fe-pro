import type { NextRequest } from "next/server";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { getOrdersDb } from "@/mocks/orders";
import { simulateLatency } from "@/mocks/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orders:view");
  if ("response" in auth) return auth.response;

  await simulateLatency(250);

  const { id } = await params;
  const order = getOrdersDb().orders.find((candidate) => candidate.id === id);
  if (!order) {
    return jsonError(404, "NOT_FOUND", "Order not found.");
  }
  return jsonData(order);
}
