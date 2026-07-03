import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/features/examples";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forms");
  return { title: t("title") };
}

export default async function FormExamplePage() {
  const t = await getTranslations("forms");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProjectForm />
    </div>
  );
}
