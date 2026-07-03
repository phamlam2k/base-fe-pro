import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  Order,
  OrderListParams,
  OrderStatus,
} from "@/features/orders/types";

export const ordersApi = {
  async list(params: OrderListParams): Promise<Paginated<Order>> {
    const response = await apiClient.get<ApiResponse<Paginated<Order>>>(
      "/orders",
      { params },
    );
    return response.data.data;
  },

  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<ApiResponse<Order>>(
      `/orders/${id}/status`,
      { status },
    );
    return response.data.data;
  },
};

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function orderListOptions(params: OrderListParams) {
  return queryOptions({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function orderDetailOptions(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
  });
}
