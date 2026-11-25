"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ROUTES } from "@/shared/config/routes";
import {
  acceptanceRequestApi,
  type CreateMaterialRequestInput,
  type CreateWorkRequestInput,
  type ResubmitInput,
} from "@/entities/acceptance-request";

interface SubmitArgs {
  input: CreateWorkRequestInput | CreateMaterialRequestInput;
}

interface ResubmitArgs {
  id: string;
  input: ResubmitInput;
  isMaterial: boolean;
}

/**
 * MAD-8/9 — tạo phiếu. Ảnh + hóa đơn đã upload-ngay (staging) và gửi kèm bằng KEY
 * trong input → không upload lại. Điều hướng về danh sách khi xong.
 */
export function useCreateAcceptanceRequest() {
  const router = useRouter();
  const t = useTranslations("acceptanceRequest");

  return useMutation({
    mutationFn: async ({ input }: SubmitArgs) =>
      input.type === "material"
        ? acceptanceRequestApi.createMaterial(input)
        : acceptanceRequestApi.createWork(input),
    onSuccess: (req) => {
      toast.success(t("created", { code: req.code }));
      router.push(ROUTES.acceptanceRequests);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

/**
 * MAD-13 — NT bổ sung & gửi lại phiếu: cập nhật field (kèm KEY ảnh/hóa đơn bổ sung)
 * → về Chờ xác nhận. Điều hướng về chi tiết phiếu.
 */
export function useResubmitAcceptanceRequest() {
  const router = useRouter();
  const t = useTranslations("acceptanceRequest");

  return useMutation({
    mutationFn: async ({ id, input }: ResubmitArgs) =>
      acceptanceRequestApi.resubmit(id, input),
    onSuccess: (req) => {
      toast.success(t("resubmitted", { code: req.code }));
      router.push(ROUTES.acceptanceRequestDetail(req.id));
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}
