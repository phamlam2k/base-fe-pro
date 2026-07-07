import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/shared/ui/page-header";
import { UsersView } from "./users-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("users");
  return { title: t("title") };
}

export async function UsersPage() {
  const t = await getTranslations("users");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <UsersView />
    </div>
  );
}
