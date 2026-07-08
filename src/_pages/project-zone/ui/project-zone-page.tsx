import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { ROUTES } from "@/shared/config/routes";
import { ZoneEditor } from "@/features/manage-project-zone";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projectZone");
  return { title: t("title") };
}

export async function ProjectZonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const t = await getTranslations("projectZone");
  const { id } = await params;
  const { name } = await searchParams;

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" size="sm" className="justify-self-start">
        <Link href={ROUTES.organization}>
          <ArrowLeft />
          {t("back")}
        </Link>
      </Button>
      <PageHeader
        title={name ? t("titleFor", { name }) : t("title")}
        description={t("description")}
      />
      <ZoneEditor projectId={id} projectName={name} />
    </div>
  );
}
