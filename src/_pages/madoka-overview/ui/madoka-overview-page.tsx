"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { useSession } from "@/entities/session";
import { acceptanceRequestApi } from "@/entities/acceptance-request";
import { useSelectedProjectStore } from "@/features/select-project";

/** MAD-5 — Trang chủ / Tổng quan (bản PC, wireframe WF4). KPI từ app acceptance. */
export function MadokaOverviewPage() {
  const t = useTranslations("acceptanceRequest");
  const { user } = useSession();
  const canCreate = canAccessAcceptance(user.role, user.madokaRole, "create");

  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const { data: summary } = useQuery({
    queryKey: ["acceptance-requests", "summary", projectId],
    queryFn: () => acceptanceRequestApi.summary(projectId ?? undefined),
  });

  const kpis = [
    { label: t("kpiPending"), value: summary?.pending },
    { label: t("kpiSupplement"), value: summary?.supplement },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t("overviewGreeting", { name: user.name })}
        </h1>
        {canCreate ? (
          <Button asChild>
            <Link href={ROUTES.acceptanceRequestNew}>
              <Plus className="size-4" /> {t("newRequest")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold">{kpi.value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800 lg:max-w-2xl">
        {t("diaryBanner")}
      </div>
    </div>
  );
}
