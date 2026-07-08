"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { projectApi, projectQueries, type GeoPolygon } from "@/entities/project";

/** Save (or clear) a project's site boundary. */
export function useSaveProjectZone(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("projectZone");
  return useMutation({
    mutationFn: (polygon: GeoPolygon | null) => projectApi.saveZone(projectId, polygon),
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      qc.invalidateQueries({ queryKey: projectQueries.zone(projectId).queryKey });
    },
    onError: (error) => toast.error(error.message),
  });
}
