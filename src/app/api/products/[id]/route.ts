import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { createProductFormSchema } from "@/features/products/schemas";
import { getProductsDb } from "@/mocks/products";
import { simulateLatency } from "@/mocks/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "products:update");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const { id } = await params;
  const db = getProductsDb();
  const product = db.products.find((candidate) => candidate.id === id);
  if (!product) {
    return jsonError(404, "NOT_FOUND", "Product not found.");
  }

  const body = await request.json().catch(() => null);
  const parsed = createProductFormSchema().partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Invalid product data.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  Object.assign(product, parsed.data);
  return jsonData(product);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "products:delete");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const { id } = await params;
  const db = getProductsDb();
  const index = db.products.findIndex((candidate) => candidate.id === id);
  if (index === -1) {
    return jsonError(404, "NOT_FOUND", "Product not found.");
  }

  db.products.splice(index, 1);
  return jsonData(null);
}
