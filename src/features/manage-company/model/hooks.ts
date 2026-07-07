"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { companyApi, companyQueries, type CompanyFormValues } from "@/entities/company";

export function useCreateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: CompanyFormValues) => companyApi.create(input),
    onSuccess: () => {
      toast.success(t("toasts.companyCreated"));
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyFormValues> }) =>
      companyApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.companyUpdated"));
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
