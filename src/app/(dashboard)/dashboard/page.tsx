import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { DashboardView } from "@/widgets/dashboard-overview";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DashboardView />
    </div>
  );
}
