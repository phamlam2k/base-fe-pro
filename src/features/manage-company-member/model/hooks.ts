"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { companyQueries } from "@/entities/company";
import {
  companyMemberApi,
  companyMemberQueries,
  type MemberCreateInput,
  type MemberFormValues,
} from "@/entities/company-member";

export function useCreateMember(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: MemberCreateInput) =>
      companyMemberApi.create(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.memberCreated"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberFormValues> }) =>
      companyMemberApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.memberUpdated"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => companyMemberApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.memberDeleted"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
