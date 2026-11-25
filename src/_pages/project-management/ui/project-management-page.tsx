import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { ProjectConsole } from "@/widgets/org-console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projectManagement");
  return { title: t("title") };
}

export async function ProjectManagementPage() {
  const t = await getTranslations("projectManagement");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProjectConsole />
    </div>
  );
}
