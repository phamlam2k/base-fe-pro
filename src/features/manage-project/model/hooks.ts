"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { companyQueries } from "@/entities/company";
import { projectApi, projectQueries, type ProjectFormValues } from "@/entities/project";

export function useCreateProject(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: ProjectFormValues) => projectApi.create(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.projectCreated"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectFormValues> }) =>
      projectApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.projectUpdated"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.projectDeleted"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
