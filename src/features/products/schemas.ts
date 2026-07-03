import { z } from "zod";

import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
} from "@/features/products/types";

type TFn = (key: string) => string;

export function createProductFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.nameMin", "Name must be at least 2 characters") }),
    sku: z
      .string()
      .regex(/^[A-Za-z0-9-]{3,}$/, {
        message: msg("validation.skuFormat", "SKU: letters, digits and dashes, min 3 chars"),
      }),
    category: z.enum(PRODUCT_CATEGORIES, {
      message: msg("validation.categoryRequired", "Select a category"),
    }),
    price: z
      .number({ message: msg("validation.priceRequired", "Enter a valid price") })
      .min(0, { message: msg("validation.priceMin", "Price must be ≥ 0") }),
    stock: z
      .number({ message: msg("validation.stockRequired", "Enter a valid stock count") })
      .int({ message: msg("validation.stockInt", "Stock must be a whole number") })
      .min(0, { message: msg("validation.stockMin", "Stock must be ≥ 0") }),
    status: z.enum(PRODUCT_STATUSES, {
      message: msg("validation.statusRequired", "Select a status"),
    }),
  });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

/** Query-string schema for the mock API route. */
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.enum([...PRODUCT_CATEGORIES, "all"]).optional(),
  status: z.enum([...PRODUCT_STATUSES, "all"]).optional(),
  sortBy: z.enum(["name", "price", "stock", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});
