"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ROUTES } from "@/shared/config/routes";
import {
  constructionLogApi,
  type CreateLogInput,
  type SupervisorConfirmInput,
} from "@/entities/construction-log";

export function useCreateLog() {
  const router = useRouter();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: (input: CreateLogInput) => constructionLogApi.create(input),
    onSuccess: () => {
      toast.success(t("created"));
      router.push(ROUTES.constructionLogs);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

/** MAD-16 — TVGS ký duyệt. */
export function useSignLog() {
  const qc = useQueryClient();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: ({
      id,
      signaturePhoto,
      gpsLat,
      gpsLng,
    }: {
      id: string;
      signaturePhoto: string;
      gpsLat?: number;
      gpsLng?: number;
    }) => constructionLogApi.sign(id, { signaturePhoto, gpsLat, gpsLng }),
    onSuccess: () => {
      toast.success(t("signed"));
      qc.invalidateQueries({ queryKey: ["construction-logs"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** MAD-16 — TVGS trả về NT chỉnh sửa. */
export function useRequestLogRevision() {
  const qc = useQueryClient();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      constructionLogApi.requestRevision(id, reason),
    onSuccess: () => {
      toast.success(t("revisionSent"));
      qc.invalidateQueries({ queryKey: ["construction-logs"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** TVGS đánh giá + nhận xét + XÁC NHẬN (không sinh trắc). */
export function useSupervisorConfirm() {
  const qc = useQueryClient();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & SupervisorConfirmInput) =>
      constructionLogApi.supervisorConfirm(id, input),
    onSuccess: () => {
      toast.success(t("confirmed"));
      qc.invalidateQueries({ queryKey: ["construction-logs"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** CĐT nhận xét + XÁC NHẬN (tuỳ chọn). */
export function useInvestorConfirm() {
  const qc = useQueryClient();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      constructionLogApi.investorConfirm(id, comment),
    onSuccess: () => {
      toast.success(t("confirmed"));
      qc.invalidateQueries({ queryKey: ["construction-logs"] });
    },
    onError: (error) => toast.error(error.message),
  });
}

/** NT ghi 'Ý kiến tiếp thu'. */
export function useContractorReply() {
  const qc = useQueryClient();
  const t = useTranslations("constructionLog");
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      replySupervisor?: string;
      replyInvestor?: string;
    }) => constructionLogApi.contractorReply(id, input),
    onSuccess: () => {
      toast.success(t("replySaved"));
      qc.invalidateQueries({ queryKey: ["construction-logs"] });
    },
    onError: (error) => toast.error(error.message),
  });
}
