"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  orderDetailOptions,
  orderKeys,
  orderListOptions,
  ordersApi,
} from "@/features/orders/api";
import type { OrderListParams, OrderStatus } from "@/features/orders/types";

export function useOrders(params: OrderListParams) {
  return useQuery(orderListOptions(params));
}

export function useOrder(id: string) {
  return useQuery(orderDetailOptions(id));
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("orders");

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (order) => {
      toast.success(t("statusUpdated", { status: t(`statuses.${order.status}`) }));
      // Write the fresh detail straight into cache, then re-sync lists.
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => toast.error(error.message),
  });
}
