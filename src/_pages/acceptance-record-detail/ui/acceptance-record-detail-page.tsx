"use client";

import * as React from "react";
import { FileText, ImageIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { formatDateTime } from "@/shared/lib/format-date";
import { toast } from "sonner";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import { FileViewer } from "@/shared/ui/file-viewer";
import { ImageGallery } from "@/shared/ui/image-gallery";
import { ROUTES } from "@/shared/config/routes";
import { useSession } from "@/entities/session";
import { acceptanceRequestApi, statusColorClass } from "@/entities/acceptance-request";
import { pdfTemplateQueries } from "@/entities/pdf-template";
import { documentTemplateBindingQueries } from "@/entities/document-template-binding";

/** Chi tiết biên bản nghiệm thu + CĐT phủ quyết (kèm lý do). */
export function AcceptanceRecordDetailPage({ id }: { id: string }) {
  const t = useTranslations("acceptanceRecord");
  const tReq = useTranslations("acceptanceRequest");
  const { user } = useSession();
  const queryClient = useQueryClient();
  const canVeto = user.madokaRole === "investor" || user.role === "admin";
  const router = useRouter();
  const [vetoOpen, setVetoOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const { data: rec, isLoading } = useQuery({
    queryKey: ["acceptance-records", "detail", id],
    queryFn: () => acceptanceRequestApi.record(id),
  });

  // Mẫu PDF để in biên bản (chỉ nạp khi mở dialog).
  const { data: templates } = useQuery({
    ...pdfTemplateQueries.list(),
    enabled: exportOpen,
  });
  const publishedTemplates = (templates ?? []).filter((tpl) => tpl.isPublished);

  // Mẫu MẶC ĐỊNH đã gán cho loại biên bản này (công việc / vật liệu) → xuất 1 chạm.
  const docType =
    rec?.type === "work" ? "acceptance_work" : "acceptance_material";
  const { data: defaultTpl } = useQuery({
    ...documentTemplateBindingQueries.resolve(docType),
    enabled: !!rec && rec.requestStatus === "approved",
  });

  const veto = useMutation({
    mutationFn: () => acceptanceRequestApi.vetoRecord(id, reason.trim()),
    onSuccess: () => {
      toast.success(t("vetoDone"));
      setVetoOpen(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["acceptance-records"] });
    },
    onError: () => toast.error(t("vetoFailed")),
  });

  if (isLoading || !rec) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }

  const isVetoed = rec.result === "rejected_by_investor";
  // Chỉ hiển thị ảnh thật (data URL / http / đường dẫn); bỏ chuỗi placeholder cũ (vd "field-1").
  const photos = rec.inspectionPhotos.filter((s) =>
    /^(data:image\/|https?:\/\/|\/)/.test(s),
  );
  // Ảnh hiện trạng đính kèm phiếu yêu cầu (list object {image}).
  const requestPhotos = (rec.requestPhotos ?? [])
    .map((p) => p.image)
    .filter((s) => /^(data:image\/|https?:\/\/|\/)/.test(s));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {rec.code} · {rec.item}
        </h1>
        <Badge variant="secondary">{rec.typeDisplay}</Badge>
        <Badge
          variant="outline"
          className={isVetoed ? "text-red-600" : statusColorClass(rec.result)}
        >
          {rec.resultDisplay}
        </Badge>
        {/* Chỉ xuất PDF khi phiếu đang Chấp thuận (approved). Ưu tiên mẫu đã gán. */}
        {rec.requestStatus === "approved" ? (
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (defaultTpl?.templateId) {
                  router.push(
                    `${ROUTES.pdfFormFill(defaultTpl.templateId)}?acceptanceRequestId=${rec.requestId}`,
                  );
                } else {
                  toast.info(t("noDefaultTemplate"));
                }
              }}
            >
              {t("exportDefault")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              {t("chooseTemplate")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          {/* Ảnh hiện trạng đính kèm PHIẾU YÊU CẦU */}
          <div>
            <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
              {t("requestPhotos")}
            </p>
            {requestPhotos.length > 0 ? (
              <ImageGallery images={requestPhotos} />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
            )}
          </div>

          {/* Ảnh hiện trường nghiệm thu */}
          <div>
            <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
              {t("fieldInspectionPhotos")}
            </p>
            {photos.length > 0 ? (
              <ImageGallery images={photos} />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
            )}
          </div>

          {/* Xác nhận 2 bên */}
          <div>
            <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
              {t("confirmation")}
            </p>
            <ul className="grid gap-2 text-sm">
              <ConfirmRow
                who={`${rec.contractorName || "—"} (${t("contractor")})`}
                at={rec.contractorConfirmedAt}
              />
              <ConfirmRow
                who={`${rec.supervisorName || "—"} (${t("supervisor")})`}
                at={rec.supervisorConfirmedAt}
              />
            </ul>
          </div>

          {/* Lý do phủ quyết (nếu có) */}
          {isVetoed ? (
            <div className="grid gap-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <span className="font-medium text-destructive">{t("vetoedBanner")}</span>
              <span>{rec.vetoReason}</span>
              <span className="text-xs text-muted-foreground">
                {rec.vetoedByName}
                {rec.vetoedAt ? ` · ${formatDateTime(rec.vetoedAt)}` : ""}
              </span>
            </div>
          ) : null}
        </div>

        {/* Panel phải: tóm tắt + kết quả thí nghiệm */}
        <div className="grid content-start gap-4">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="font-medium">{rec.item}</div>
            <div className="text-muted-foreground">{rec.contractorTeamName}</div>
          </div>
          {rec.resultFile ? (
            <FileViewer
              url={rec.resultFile}
              name={rec.resultFileName}
              className="flex items-center gap-2 rounded-md border bg-emerald-50 p-2 text-sm text-emerald-800"
            >
              <FileText className="size-4" /> {rec.resultFileName ?? t("testResult")}
            </FileViewer>
          ) : null}
        </div>
      </div>

      {/* CĐT phủ quyết */}
      {canVeto && !isVetoed ? (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setVetoOpen(true)}>
            {t("veto")}
          </Button>
        </div>
      ) : null}

      <Dialog open={vetoOpen} onOpenChange={setVetoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vetoReasonTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("vetoReasonPlaceholder")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVetoOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || veto.isPending}
              onClick={() => veto.mutate()}
            >
              {t("veto")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chọn mẫu PDF → mở trình điền đã prefill theo phiếu của biên bản này */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tReq("selectTemplate")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {publishedTemplates.map((tpl) => (
              <Button
                key={tpl.id}
                variant="outline"
                className="justify-start"
                onClick={() =>
                  router.push(
                    `${ROUTES.pdfFormFill(tpl.id)}?acceptanceRequestId=${rec.requestId}`,
                  )
                }
              >
                {tpl.name}
              </Button>
            ))}
            {publishedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tReq("noTemplates")}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmRow({
  who,
  at,
}: {
  who: string;
  at: string | null;
}) {
  return (
    <li className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
      <span>✓ {who}</span>
      <span className="text-xs text-muted-foreground">{formatDateTime(at)}</span>
    </li>
  );
}
