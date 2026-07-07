import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { AppearanceSettings } from "@/features/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("appearanceTitle") };
}

export default async function AppearancePage() {
  const t = await getTranslations("settings");

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("appearanceTitle")}
        description={t("appearanceDescription")}
      />
      <AppearanceSettings />
    </div>
  );
}
