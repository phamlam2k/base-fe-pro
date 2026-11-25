"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Loader2, Plus } from "lucide-react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { useSession } from "@/entities/session";
import {
  LOG_STATUS_TABS,
  constructionLogApi,
  type LogStatusTab,
} from "@/entities/construction-log";
import { useSelectedProjectStore } from "@/features/select-project";

/** MAD-16 — Danh sách nhật ký thi công (TVGS ký, NT khai báo). */
export function ConstructionLogsPage() {
  const t = useTranslations("constructionLog");
  const tCommon = useTranslations("common");
  const { user } = useSession();
  const canCreate = canAccessAcceptance(user.role, user.madokaRole, "create");
  const [tab, setTab] = React.useState<LogStatusTab>("all");
  const [page, setPage] = React.useState(1);
  // Đổi tab → về trang 1 (reset ngay trong handler, tránh setState trong effect).
  const changeTab = (next: LogStatusTab) => {
    setTab(next);
    setPage(1);
  };

  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["construction-logs", projectId, tab, page],
    // "all" = không lọc trạng thái; lọc theo dự án đang chọn.
    queryFn: () =>
      constructionLogApi.list(tab === "all" ? undefined : tab, page, projectId ?? undefined),
    placeholderData: keepPreviousData,
  });
  const logs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Multi-select để XUẤT GỘP PDF (mọi nhật ký đều chọn được).
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allSelected = logs.length > 0 && logs.every((l) => selected.has(l.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      if (logs.every((l) => prev.has(l.id))) {
        const next = new Set(prev);
        logs.forEach((l) => next.delete(l.id));
        return next;
      }
      const next = new Set(prev);
      logs.forEach((l) => next.add(l.id));
      return next;
    });
  }

  const exportMerged = useMutation({
    mutationFn: () => constructionLogApi.exportMergedLogs([...selected]),
    onSuccess: (url) => {
      window.open(url, "_blank", "noopener");
      setSelected(new Set());
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onExportMerged() {
    if (selected.size === 0) {
      toast.info(t("selectToExport"));
      return;
    }
    exportMerged.mutate();
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <span className="text-sm text-muted-foreground">
              {t("selectedCount", { count: selected.size })}
            </span>
          ) : null}
          <Button
            variant="outline"
            onClick={onExportMerged}
            disabled={selected.size === 0 || exportMerged.isPending}
          >
            {exportMerged.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {exportMerged.isPending ? t("exporting") : t("exportMerged")}
          </Button>
          {canCreate ? (
            <Button asChild>
              <Link href={ROUTES.constructionLogNew}>
                <Plus className="size-4" /> {t("newLog")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        {LOG_STATUS_TABS.map((tabDef) => (
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
              <th className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  disabled={logs.length === 0}
                  aria-label="select-all"
                />
              </th>
              <th>{t("colDate")}</th>
              <th>{t("colContractor")}</th>
              <th>{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 [&>td]:px-4 [&>td]:py-3">
                  <td>
                    <Checkbox
                      checked={selected.has(log.id)}
                      onCheckedChange={() => toggle(log.id)}
                      aria-label={`select-${log.logDate}`}
                    />
                  </td>
                  <td>
                    <Link
                      href={`${ROUTES.constructionLogs}/${log.id}`}
                      className="font-medium hover:underline"
                    >
                      {log.logDate}
                    </Link>
                  </td>
                  <td>{log.contractorTeamName ?? "—"}</td>
                  <td>
                    <Badge variant="secondary">{log.statusDisplay}</Badge>
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
