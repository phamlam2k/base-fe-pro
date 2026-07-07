import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { OrganizationView } from "@/widgets/org-console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("organization");
  return { title: t("title") };
}

export default async function OrganizationPage() {
  const t = await getTranslations("organization");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <OrganizationView />
    </div>
  );
}
