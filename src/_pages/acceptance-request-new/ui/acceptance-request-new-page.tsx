import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { getCurrentUser } from "@/shared/lib/auth/session";
import { CreateAcceptanceRequestForm } from "@/features/create-acceptance-request";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acceptanceRequest");
  return { title: t("newTitle") };
}

export async function AcceptanceRequestNewPage() {
  // Chốt chặn server-side: chỉ NT/Admin mới vào được trang tạo phiếu (MAD-4).
  const user = await getCurrentUser();
  if (!user || !canAccessAcceptance(user.role, user.madokaRole, "create")) {
    redirect(ROUTES.overview);
  }
  return (
    <div className="mx-auto max-w-5xl">
      <CreateAcceptanceRequestForm />
    </div>
  );
}
