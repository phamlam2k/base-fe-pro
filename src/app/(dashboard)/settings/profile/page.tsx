import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { ProfileForm } from "@/features/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("profileTitle") };
}

export default async function ProfilePage() {
  const t = await getTranslations("settings");

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("profileTitle")}
        description={t("profileDescription")}
      />
      <ProfileForm />
    </div>
  );
}
