import type { NextRequest } from "next/server";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { bulkDeleteSchema } from "@/features/products/schemas";
import { getProductsDb } from "@/mocks/products";
import { simulateLatency } from "@/mocks/db";

/** POST (not DELETE) because it carries a body — mirrors common REST practice. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "products:delete");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const body = await request.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(422, "VALIDATION_ERROR", "Provide a non-empty ids array.");
  }

  const db = getProductsDb();
  const ids = new Set(parsed.data.ids);
  const before = db.products.length;
  db.products = db.products.filter((product) => !ids.has(product.id));

  return jsonData({ deleted: before - db.products.length });
}
