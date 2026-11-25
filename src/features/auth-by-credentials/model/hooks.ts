"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ROUTES, defaultLandingFor } from "@/shared/config/routes";
import { authApi } from "@/features/auth-by-credentials/api/auth.api";
import type { LoginValues } from "@/features/auth-by-credentials/model/schemas";

export function useLogin(redirectTo?: string) {
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: (input: LoginValues) => authApi.login(input),
    onSuccess: (user) => {
      toast.success(t("loginSuccess", { name: user.name }));
      // refresh() re-runs server components so the new session cookie is
      // picked up by the protected layout. SuperAdmin không có Dashboard →
      // đưa về trang mặc định theo vai trò.
      router.replace(redirectTo ?? defaultLandingFor(user.role));
      router.refresh();
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      router.replace(ROUTES.login);
      router.refresh();
    },
  });
}
