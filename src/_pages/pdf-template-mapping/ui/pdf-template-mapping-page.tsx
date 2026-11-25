"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { pdfTemplateQueries } from "@/entities/pdf-template";
import {
  documentTemplateBindingApi,
  documentTemplateBindingQueries,
  type TemplateBindingRow,
} from "@/entities/document-template-binding";

const UNSET = "__unset__";

/** Ánh xạ LOẠI CHỨNG TỪ → biểu mẫu PDF. Mỗi loại 1 dòng: chọn mẫu + Lưu. */
export function PdfTemplateMappingPage() {
  const t = useTranslations("pdfMapping");
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery(
    documentTemplateBindingQueries.list(),
  );
  const { data: templates = [] } = useQuery(pdfTemplateQueries.list());
  // Chỉ cho gán mẫu đã xuất bản (backend cũng chặn khi xuất).
  const published = templates.filter((tpl) => tpl.isPublished);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium">
                <th className="w-1/3">{t("colType")}</th>
                <th>{t("colTemplate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MappingRow
                  key={`${row.documentType}:${row.templateId ?? ""}`}
                  row={row}
                  templates={published.map((tpl) => ({ id: tpl.id, name: tpl.name }))}
                  onSaved={() =>
                    qc.invalidateQueries({
                      queryKey: documentTemplateBindingQueries.lists(),
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {templates.length > 0 && published.length === 0 ? (
        <p className="text-sm text-amber-600">{t("noTemplates")}</p>
      ) : null}
    </div>
  );
}

function MappingRow({
  row,
  templates,
  onSaved,
}: {
  row: TemplateBindingRow;
  templates: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const t = useTranslations("pdfMapping");
  // Khởi tạo từ prop; parent remount qua `key` khi templateId đổi (sau khi lưu).
  const [value, setValue] = React.useState<string>(row.templateId ?? UNSET);

  const save = useMutation({
    mutationFn: () =>
      documentTemplateBindingApi.upsert(
        row.documentType,
        value === UNSET ? null : value,
      ),
    onSuccess: () => {
      toast.success(t("saved"));
      onSaved();
    },
    onError: () => toast.error(t("saveFailed")),
  });

  const dirty = (row.templateId ?? UNSET) !== value;
  // Chưa gán mẫu công ty nhưng có fallback nền tảng → gợi ý đang dùng mẫu nào.
  const platformHint =
    !row.templateId && row.source === "platform" && row.effectiveTemplateName
      ? t("usingPlatform", { name: row.effectiveTemplateName })
      : null;

  return (
    <tr className="border-b last:border-0 [&>td]:px-4 [&>td]:py-3">
      <td className="font-medium align-top">{row.label}</td>
      <td>
        <div className="flex items-center gap-3">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder={t("unset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>{t("unset")}</SelectItem>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("save")}
          </Button>
        </div>
        {platformHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{platformHint}</p>
        ) : null}
      </td>
    </tr>
  );
}
