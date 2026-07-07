"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { projectMemberApi, projectMemberQueries } from "@/entities/project-member";

export function useCreateProjectMember(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (companyMemberId: string) =>
      projectMemberApi.create(projectId, companyMemberId),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberAdded"));
      qc.invalidateQueries({ queryKey: projectMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProjectMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => projectMemberApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberRemoved"));
      qc.invalidateQueries({ queryKey: projectMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
