import type { ListParams } from "@/types/api";

export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CATEGORIES = [
  "electronics",
  "apparel",
  "home",
  "beauty",
  "sports",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
}

export interface ProductListParams extends ListParams {
  category?: ProductCategory | "all";
  status?: ProductStatus | "all";
  sortBy?: "name" | "price" | "stock" | "createdAt";
}
