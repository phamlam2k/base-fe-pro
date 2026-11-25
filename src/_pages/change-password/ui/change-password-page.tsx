import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ChangePasswordForm } from "@/features/change-password";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("changePassword");
  return { title: t("title") };
}

export function ChangePasswordPage() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <ChangePasswordForm firstLogin />
    </div>
  );
}
