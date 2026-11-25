"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { useSession } from "@/entities/session";
import {
  ACCEPTANCE_TABS,
  acceptanceRequestApi,
  statusColorClass,
  isRequestOverdue,
  type AcceptanceTab,
} from "@/entities/acceptance-request";
import { useSelectedProjectStore } from "@/features/select-project";

/** MAD-12 — Hộp thư yêu cầu nghiệm thu (TVGS), wireframe WF6. */
export function AcceptanceInboxPage() {
  const t = useTranslations("acceptanceRequest");
  const tCommon = useTranslations("common");
  const { user } = useSession();
  const canCreate = canAccessAcceptance(user.role, user.madokaRole, "create");
  const [tab, setTab] = React.useState<AcceptanceTab>("all");
  const [page, setPage] = React.useState(1);
  // Đổi tab → về trang 1 (reset ngay trong handler, tránh setState trong effect).
  const changeTab = (next: AcceptanceTab) => {
    setTab(next);
    setPage(1);
  };

  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["acceptance-requests", projectId, tab, page],
    // Tab "Tất cả" → gọi list KHÔNG status; lọc theo dự án đang chọn.
    queryFn: () =>
      acceptanceRequestApi.list(tab === "all" ? undefined : tab, page, projectId ?? undefined),
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("inboxTitle")}</h1>
        {canCreate ? (
          <Button asChild>
            <Link href={ROUTES.acceptanceRequestNew}>
              <Plus className="size-4" /> {t("newRequest")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2">
        {ACCEPTANCE_TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => changeTab(tabDef.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              tab === tabDef.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-muted-foreground">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium">
              <th>{t("colCode")}</th>
              <th>{t("colType")}</th>
              <th>{t("colItem")}</th>
              <th>{t("colContractor")}</th>
              <th>{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((req) => (
                <tr
                  key={req.id}
                  className="border-b last:border-0 [&>td]:px-4 [&>td]:py-3"
                >
                  <td>
                    <Link
                      href={`${ROUTES.acceptanceRequests}/${req.id}`}
                      className="font-medium hover:underline"
                    >
                      {req.code}
                    </Link>
                  </td>
                  <td>
                    <Badge variant="secondary">{req.typeDisplay}</Badge>
                    {req.needsSampling ? (
                      <Badge variant="outline" className="ml-2">
                        {t("needsPtn")}
                      </Badge>
                    ) : null}
                  </td>
                  <td>
                    {req.type === "material" ? req.materialType : req.description}
                    {req.location ? (
                      <span className="text-muted-foreground"> · {req.location}</span>
                    ) : null}
                  </td>
                  <td>{req.contractorTeamName ?? "—"}</td>
                  <td>
                    <span className={statusColorClass(req.status)}>
                      {req.statusDisplay}
                    </span>
                    {isRequestOverdue(req) ? (
                      <Badge variant="outline" className="ml-2 border-red-300 text-red-600">
                        {t("overdueInspection")}
                      </Badge>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">
            {tCommon("pageOf", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {tCommon("pagePrev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {tCommon("pageNext")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
