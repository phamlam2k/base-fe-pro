import { HttpResponse, http } from "msw";

import { buildPaginated, buildProduct } from "@/test/factories";

/**
 * Default happy-path handlers. Tests override per-case with `server.use(...)`.
 * We mock at the NETWORK boundary (not axios, not the hooks) so tests
 * exercise the real client stack: axios interceptors, envelope parsing,
 * react-query caching.
 */
export const defaultProducts = [
  buildProduct({ id: "prd_001", name: "Aurora Headphones", sku: "AUR-HEA-001" }),
  buildProduct({ id: "prd_002", name: "Nimbus Backpack", sku: "NIM-BAC-002", category: "apparel" }),
  buildProduct({ id: "prd_003", name: "Vertex Lamp", sku: "VER-LAM-003", category: "home", stock: 0 }),
];

export const handlers = [
  http.get("/api/products", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const items = search
      ? defaultProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(search) ||
            product.sku.toLowerCase().includes(search),
        )
      : defaultProducts;
    return HttpResponse.json({ data: buildPaginated(items) });
  }),

  http.get("/api/notifications", () =>
    HttpResponse.json({ data: { items: [], unreadCount: 0 } }),
  ),
];
