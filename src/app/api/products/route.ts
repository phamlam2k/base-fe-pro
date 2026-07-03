import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import {
  createProductFormSchema,
  productListQuerySchema,
} from "@/features/products/schemas";
import {
  allocateProductId,
  getProductsDb,
  type DbProduct,
} from "@/mocks/products";
import { simulateLatency } from "@/mocks/db";
import type { Paginated } from "@/types/api";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "products:view");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const query = productListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }

  const { page, pageSize, search, category, status, sortBy, sortOrder } =
    query.data;

  let products = [...getProductsDb().products];

  if (search) {
    const needle = search.toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle),
    );
  }
  if (category && category !== "all") {
    products = products.filter((product) => product.category === category);
  }
  if (status && status !== "all") {
    products = products.filter((product) => product.status === status);
  }

  products.sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    const compared =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right));
    return sortOrder === "asc" ? compared : -compared;
  });

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = products.slice((page - 1) * pageSize, page * pageSize);

  return jsonData<Paginated<DbProduct>>({
    items,
    page,
    pageSize,
    total,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "products:create");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const body = await request.json().catch(() => null);
  const parsed = createProductFormSchema().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Invalid product data.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const db = getProductsDb();
  const skuTaken = db.products.some(
    (product) => product.sku.toLowerCase() === parsed.data.sku.toLowerCase(),
  );
  if (skuTaken) {
    return jsonError(409, "SKU_TAKEN", "A product with this SKU already exists.");
  }

  const product: DbProduct = {
    id: allocateProductId(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };
  db.products.unshift(product);

  return jsonData(product, { status: 201 });
}
