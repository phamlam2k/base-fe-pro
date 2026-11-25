"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  acceptanceRequestApi,
  type InspectionInput,
} from "@/entities/acceptance-request";

/** MAD-13 — TVGS xác nhận tiếp nhận phiếu. */
export function useConfirmRequest() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: (id: string) => acceptanceRequestApi.confirm(id),
    onSuccess: () => {
      toast.success(t("confirmed"));
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** TVGS dời thời gian nghiệm thu (phiếu chưa nghiệm thu xong) + ghi log. */
export function useRescheduleRequest() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: ({
      id,
      proposedAt,
      reason,
    }: {
      id: string;
      proposedAt: string;
      reason?: string;
    }) => acceptanceRequestApi.reschedule(id, { proposedAt, reason }),
    onSuccess: () => {
      toast.success(t("rescheduled"));
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** MAD-13 — TVGS trả phiếu về NT bổ sung. */
export function useRequestSupplement() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      acceptanceRequestApi.requestSupplement(id, reason),
    onSuccess: () => {
      toast.success(t("supplementSent"));
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Luồng mới — PTN xác nhận yêu cầu (phiếu Cần thí nghiệm). */
export function useConfirmTesting() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: (id: string) => acceptanceRequestApi.confirmTesting(id),
    onSuccess: () => {
      toast.success(t("testingConfirmed"));
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** Luồng mới MAD-18 — NT nộp file kết quả thí nghiệm. */
export function useUploadResult() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      acceptanceRequestApi.uploadResult(id, file),
    onSuccess: () => {
      toast.success(t("resultUploaded"));
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** MAD-14 — TVGS nghiệm thu hiện trường. */
export function usePerformInspection() {
  const qc = useQueryClient();
  const t = useTranslations("acceptanceRequest");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InspectionInput }) =>
      acceptanceRequestApi.perform(id, input),
    onSuccess: (res) => {
      toast.success(
        res.recordCode ? t("inspectionRecord", { code: res.recordCode }) : t("inspectionDone"),
      );
      qc.invalidateQueries({ queryKey: ["acceptance-requests"] });
    },
    onError: (error) => toast.error(error.message),
  });
}
