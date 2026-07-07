"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  userApi,
  userQueries,
  type UserFormValues,
  type UserListParams,
} from "@/entities/user";

export function useUsers(params: UserListParams) {
  return useQuery(userQueries.list(params));
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: (input: UserFormValues) => userApi.create(input),
    onSuccess: () => {
      toast.success(t("created"));
      queryClient.invalidateQueries({ queryKey: userQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UserFormValues> }) =>
      userApi.update(id, input),
    onSuccess: () => {
      toast.success(t("updated"));
      queryClient.invalidateQueries({ queryKey: userQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleted"));
      queryClient.invalidateQueries({ queryKey: userQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
