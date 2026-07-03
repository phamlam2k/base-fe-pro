"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { productKeys, productListOptions, productsApi } from "@/features/products/api";
import type { ProductFormValues } from "@/features/products/schemas";
import type { Product, ProductListParams } from "@/features/products/types";
import type { Paginated } from "@/types/api";

export function useProducts(params: ProductListParams) {
  return useQuery(productListOptions(params));
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("products");

  return useMutation({
    mutationFn: (input: ProductFormValues) => productsApi.create(input),
    onSuccess: () => {
      toast.success(t("created"));
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("products");

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductFormValues> }) =>
      productsApi.update(id, input),
    onSuccess: () => {
      toast.success(t("updated"));
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

/**
 * OPTIMISTIC delete — the reference implementation for this codebase:
 * remove the row from every cached list immediately, roll back on error,
 * re-sync with the server afterwards either way.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const t = useTranslations("products");

  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const snapshots = queryClient.getQueriesData<Paginated<Product>>({
        queryKey: productKeys.lists(),
      });
      queryClient.setQueriesData<Paginated<Product>>(
        { queryKey: productKeys.lists() },
        (current) =>
          current && {
            ...current,
            items: current.items.filter((product) => product.id !== id),
            total: current.total - 1,
          },
      );
      return { snapshots };
    },
    onError: (error, _id, context) => {
      // Roll back every list we touched.
      context?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("deleted")),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();
  const t = useTranslations("products");

  return useMutation({
    mutationFn: (ids: string[]) => productsApi.bulkRemove(ids),
    onSuccess: (deleted) => {
      toast.success(t("bulkDeleted", { count: deleted }));
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}
