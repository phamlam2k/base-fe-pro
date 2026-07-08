"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  projectApi,
  projectQueries,
  type ProjectZoneItem,
} from "@/entities/project";

/** Save the full list of a project's named site boundaries. */
export function useSaveProjectZones(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("projectZone");
  return useMutation({
    mutationFn: (zones: ProjectZoneItem[]) => projectApi.saveZones(projectId, zones),
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      qc.invalidateQueries({ queryKey: projectQueries.zones(projectId).queryKey });
    },
    onError: (error) => toast.error(error.message),
  });
}
