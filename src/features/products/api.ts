import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type { ProductFormValues } from "@/features/products/schemas";
import type { Product, ProductListParams } from "@/features/products/types";

export const productsApi = {
  async list(params: ProductListParams): Promise<Paginated<Product>> {
    const response = await apiClient.get<ApiResponse<Paginated<Product>>>(
      "/products",
      { params },
    );
    return response.data.data;
  },

  async create(input: ProductFormValues): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(
      "/products",
      input,
    );
    return response.data.data;
  },

  async update(id: string, input: Partial<ProductFormValues>): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `/products/${id}`,
      input,
    );
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async bulkRemove(ids: string[]): Promise<number> {
    const response = await apiClient.post<ApiResponse<{ deleted: number }>>(
      "/products/bulk-delete",
      { ids },
    );
    return response.data.data.deleted;
  },
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
};

export function productListOptions(params: ProductListParams) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
