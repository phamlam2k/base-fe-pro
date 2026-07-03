import { describe, expect, it } from "vitest";

import {
  createProductFormSchema,
  productListQuerySchema,
} from "@/features/products/schemas";

const validProduct = {
  name: "Aurora Headphones",
  sku: "AUR-HEA-001",
  category: "electronics",
  price: 129.99,
  stock: 42,
  status: "active",
};

describe("createProductFormSchema", () => {
  const schema = createProductFormSchema();

  it("accepts a valid product", () => {
    const result = schema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it.each([
    ["name", { name: "A" }],
    ["sku", { sku: "x" }],
    ["sku", { sku: "has spaces" }],
    ["category", { category: "food" }],
    ["price", { price: -1 }],
    ["price", { price: Number.NaN }],
    ["stock", { stock: 1.5 }],
    ["stock", { stock: -3 }],
    ["status", { status: "unknown" }],
  ])("rejects invalid %s", (field, override) => {
    const result = schema.safeParse({ ...validProduct, ...override });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain(field);
    }
  });

  it("uses the provided translator for messages", () => {
    const t = (key: string) => `translated:${key}`;
    const result = createProductFormSchema(t).safeParse({
      ...validProduct,
      name: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("translated:validation.nameMin");
    }
  });
});

describe("productListQuerySchema", () => {
  it("applies defaults for missing params", () => {
    const result = productListQuerySchema.parse({});
    expect(result).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("coerces numeric strings coming from the query string", () => {
    const result = productListQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("caps pageSize at 100", () => {
    expect(productListQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});
