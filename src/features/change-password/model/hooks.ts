"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ROUTES } from "@/shared/config/routes";
import { changePasswordApi } from "@/features/change-password/api/change-password.api";

/**
 * MAD-36 — Sau khi đổi thành công, server đã phát hành lại cookie phiên với
 * mustChangePassword=false; `router.refresh()` để layout server đọc cookie mới,
 * rồi `replace(dashboard)` cho proxy mở khoá.
 */
export function useChangePassword() {
  const router = useRouter();
  const t = useTranslations("changePassword");

  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      changePasswordApi.submit(input),
    onSuccess: () => {
      toast.success(t("success"));
      router.replace(ROUTES.dashboard);
      router.refresh();
    },
  });
}
