"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  userKeys,
  userListOptions,
  usersApi,
} from "@/features/users/api";
import type { UserFormValues } from "@/features/users/schemas";
import type { UserListParams } from "@/features/users/types";

export function useUsers(params: UserListParams) {
  return useQuery(userListOptions(params));
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: (input: UserFormValues) => usersApi.create(input),
    onSuccess: () => {
      toast.success(t("created"));
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UserFormValues> }) =>
      usersApi.update(id, input),
    onSuccess: () => {
      toast.success(t("updated"));
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const t = useTranslations("users");

  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      toast.success(t("deleted"));
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}
