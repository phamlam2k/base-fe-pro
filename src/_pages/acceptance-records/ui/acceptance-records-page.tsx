"use client";

import * as React from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { formatDateTime } from "@/shared/lib/format-date";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ROUTES } from "@/shared/config/routes";
import { toCsv, downloadCsv } from "@/shared/lib/csv";
import {
  acceptanceRequestApi,
  statusColorClass,
  type AcceptanceRecord,
} from "@/entities/acceptance-request";
import { useSelectedProjectStore } from "@/features/select-project";

/** MAD-11 — Danh sách biên bản nghiệm thu (bản PC, wireframe WF5). */
export function AcceptanceRecordsPage() {
  const t = useTranslations("acceptanceRecord");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [page, setPage] = React.useState(1);

  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["acceptance-records", projectId, page],
    queryFn: () => acceptanceRequestApi.records(page, projectId ?? undefined),
    placeholderData: keepPreviousData,
  });
  // Ghi chú: Xuất Excel chỉ gồm biên bản của TRANG HIỆN TẠI.
  const records = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Multi-select để XUẤT GỘP PDF (chỉ biên bản đã Chấp thuận mới chọn được).
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const selectable = records.filter((r) => r.result === "approved");
  const allSelected =
    selectable.length > 0 && selectable.every((r) => selected.has(r.id));

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
      if (selectable.every((r) => prev.has(r.id))) {
        const next = new Set(prev);
        selectable.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      selectable.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const exportMerged = useMutation({
    mutationFn: () =>
      acceptanceRequestApi.exportMergedRecords([...selected]),
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

  function exportExcel() {
    const csv = toCsv<AcceptanceRecord>(records, [
      { key: "code", header: t("colCode") },
      { key: "typeDisplay", header: t("colType") },
      { key: "item", header: t("colItem") },
      { key: "resultDisplay", header: t("colStatus") },
      { key: "createdAt", header: t("colTime") },
    ]);
    downloadCsv("bien-ban-nghiem-thu.csv", csv);
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
          <Button variant="outline" onClick={exportExcel} disabled={!records.length}>
            <Download className="size-4" /> {t("exportExcel")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-muted-foreground">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium">
              <th className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  disabled={selectable.length === 0}
                  aria-label="select-all"
                />
              </th>
              <th>{t("colCode")}</th>
              <th>{t("colType")}</th>
              <th>{t("colItem")}</th>
              <th>{t("colTime")}</th>
              <th>{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() =>
                    router.push(ROUTES.acceptanceRecordDetail(rec.id))
                  }
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/50 [&>td]:px-4 [&>td]:py-3"
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(rec.id)}
                      onCheckedChange={() => toggle(rec.id)}
                      disabled={rec.result !== "approved"}
                      aria-label={`select-${rec.code}`}
                    />
                  </td>
                  <td className="font-medium">{rec.code}</td>
                  <td>
                    <Badge variant="secondary">{rec.typeDisplay}</Badge>
                  </td>
                  <td>{rec.item}</td>
                  <td className="text-muted-foreground">
                    {formatDateTime(rec.createdAt)}
                  </td>
                  <td>
                    <span className={statusColorClass(rec.result)}>
                      {rec.resultDisplay}
                    </span>
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
