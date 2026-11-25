"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { useSession } from "@/entities/session";
import { constructionLogApi } from "@/entities/construction-log";
import { pdfTemplateQueries } from "@/entities/pdf-template";
import { documentTemplateBindingQueries } from "@/entities/document-template-binding";
import {
  useContractorReply,
  useRequestLogRevision,
  useSupervisorConfirm,
} from "@/features/manage-construction-log";

/** Chi tiết nhật ký thi công — hiển thị + TVGS/CĐT nhận xét & xác nhận + xuất PDF. */
export function ConstructionLogDetailPage({ id }: { id: string }) {
  const t = useTranslations("constructionLog");
  const router = useRouter();
  const { user } = useSession();
  const canSign = canAccessAcceptance(user.role, user.madokaRole, "inspect");
  const isContractor = user.madokaRole === "contractor" || user.role === "admin";

  const { data: log, isLoading } = useQuery({
    queryKey: ["construction-logs", "detail", id],
    queryFn: () => constructionLogApi.getById(id),
  });

  const revision = useRequestLogRevision();
  const supConfirm = useSupervisorConfirm();
  const reply = useContractorReply();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [safety, setSafety] = React.useState<boolean | null>(null);
  const [sanitation, setSanitation] = React.useState<boolean | null>(null);
  const [supComment, setSupComment] = React.useState("");
  const [exportOpen, setExportOpen] = React.useState(false);

  // Chỉ tải danh sách mẫu khi mở dialog "Xuất theo biểu mẫu".
  const { data: templates } = useQuery({
    ...pdfTemplateQueries.list(),
    enabled: exportOpen,
  });
  const publishedTemplates = (templates ?? []).filter((tpl) => tpl.isPublished);

  // Mẫu MẶC ĐỊNH đã gán cho nhật ký thi công → xuất 1 chạm.
  const { data: defaultTpl } = useQuery(
    documentTemplateBindingQueries.resolve("construction_log"),
  );

  if (isLoading || !log) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }

  const busy = revision.isPending || supConfirm.isPending || reply.isPending;
  const canReview = log.status === "submitted" && canSign;

  const yesNo = (v: boolean | null) =>
    v === null ? "—" : v ? t("pass") : t("fail");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {t("logOfDate", { date: log.logDate })}
        </h1>
        <Badge variant="secondary">{log.statusDisplay}</Badge>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (defaultTpl?.templateId) {
                router.push(
                  `${ROUTES.pdfFormFill(defaultTpl.templateId)}?constructionLogId=${id}`,
                );
              } else {
                toast.info(t("noDefaultTemplate"));
              }
            }}
          >
            <FileSpreadsheet className="size-4" /> {t("exportDefault")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            {t("chooseTemplate")}
          </Button>
        </div>
      </div>

      {log.status === "needs_revision" && log.revisionReason ? (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          {t("revisionReason")}: {log.revisionReason}
        </div>
      ) : null}

      {/* ----- Trang 1: nội dung nhật ký ----- */}
      <div className="grid gap-4 md:max-w-3xl">
        <Field label={t("contractor")} value={log.contractorTeamName ?? "—"} />
        <Field label={t("weather")} value={log.weather || "—"} />
        <Field label={t("documents")} value={log.documents || "—"} />
        <Field label={t("equipment")} value={log.equipment || "—"} />
        <div className="grid grid-cols-3 gap-3">
          <Field label={t("commandCount")} value={num(log.commandCount)} />
          <Field label={t("workerCount")} value={num(log.workerCount)} />
          <Field label={t("securityCount")} value={num(log.securityCount)} />
        </div>
        <Field label={t("materials")} value={log.materials || "—"} />
        <Field label={t("workDone")} value={log.workDone || "—"} />

        {/* Công tác nghiệm thu = danh sách biên bản nghiệm thu của NT trong ngày
            (tự động, KHÓA — không nhập tay): mã BB · hạng mục · giờ · loại. */}
        <div className="grid gap-1.5">
          <span className="text-muted-foreground text-sm">{t("acceptanceWork")}</span>
          {log.dailyAcceptance.length ? (
            <ul className="bg-muted/50 grid gap-1.5 rounded-md p-3 text-sm">
              {log.dailyAcceptance.map((r) => (
                <li key={r.code} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">{r.code}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{r.category || "—"}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{r.time}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="rounded bg-background px-1.5 py-0.5 text-xs">
                    {r.typeLabel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-muted/50 text-muted-foreground rounded-md p-3 text-sm">
              {t("noDailyAcceptance")}
            </div>
          )}
        </div>
        <Field label={t("note")} value={log.note || "—"} />
      </div>

      {/* ----- Trang 2: đánh giá + nhận xét ----- */}
      <div className="grid gap-4 md:max-w-3xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("safety")} value={yesNo(log.safetyOk)} />
          <Field label={t("sanitation")} value={yesNo(log.sanitationOk)} />
        </div>
        <Field label={t("supervisorComment")} value={log.supervisorComment || "—"} />
        <Field
          label={t("replySupervisor")}
          value={log.contractorReplySupervisor || "—"}
        />

        {/* Khối "✓ Đã ký" — NT + TVGS (CĐT không ký nhật ký). */}
        <div className="grid gap-3 sm:grid-cols-2">
          <SignBlock label={t("sigContractor")} value={log.contractorSigned} />
          <SignBlock label={t("sigSupervisor")} value={log.supervisorSigned} />
        </div>
      </div>

      {/* ----- TVGS: đánh giá + nhận xét + xác nhận ----- */}
      {canReview ? (
        <div className="grid gap-3 rounded-lg border p-4 md:max-w-3xl">
          <p className="font-medium">{t("supervisorReview")}</p>
          <div className="grid grid-cols-2 gap-4">
            <YesNo label={t("safety")} value={safety} onChange={setSafety} t={t} />
            <YesNo
              label={t("sanitation")}
              value={sanitation}
              onChange={setSanitation}
              t={t}
            />
          </div>
          <Textarea
            rows={2}
            value={supComment}
            onChange={(e) => setSupComment(e.target.value)}
            placeholder={t("supervisorComment")}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={busy} onClick={() => setDialogOpen(true)}>
              {t("requestRevision")}
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                supConfirm.mutate({
                  id,
                  safetyOk: safety,
                  sanitationOk: sanitation,
                  comment: supComment.trim(),
                })
              }
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ----- NT: ý kiến tiếp thu (phản hồi TVGS) ----- */}
      {isContractor && log.status !== "needs_revision" ? (
        <ReplyBox
          initSup={log.contractorReplySupervisor}
          busy={busy}
          t={t}
          onSave={(replySupervisor) => reply.mutate({ id, replySupervisor })}
        />
      ) : null}

      {/* Chọn mẫu PDF rồi mở trình điền đã prefill sẵn theo nhật ký này. */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("selectTemplate")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {publishedTemplates.map((tpl) => (
              <Button
                key={tpl.id}
                variant="outline"
                className="justify-start"
                onClick={() =>
                  router.push(
                    `${ROUTES.pdfFormFill(tpl.id)}?constructionLogId=${id}`,
                  )
                }
              >
                {tpl.name}
              </Button>
            ))}
            {publishedTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noTemplates")}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("revisionReasonTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("revisionReasonPlaceholder")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!reason.trim() || busy}
              onClick={() =>
                revision.mutate(
                  { id, reason: reason.trim() },
                  { onSuccess: () => setDialogOpen(false) },
                )
              }
            >
              {t("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function num(v: number | null) {
  return v === null ? "—" : String(v);
}

function ReplyBox({
  initSup,
  busy,
  t,
  onSave,
}: {
  initSup: string;
  busy: boolean;
  t: (k: string) => string;
  onSave: (replySupervisor: string) => void;
}) {
  const [sup, setSup] = React.useState(initSup);
  return (
    <div className="grid gap-3 rounded-lg border p-4 md:max-w-3xl">
      <p className="font-medium">{t("contractorReply")}</p>
      <Textarea
        rows={2}
        value={sup}
        onChange={(e) => setSup(e.target.value)}
        placeholder={t("replySupervisor")}
      />
      <div className="flex justify-end">
        <Button variant="outline" disabled={busy} onClick={() => onSave(sup.trim())}>
          {t("saveReply")}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="bg-muted/50 rounded-md px-3 py-2 text-sm whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function SignBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="min-h-14 rounded-md border p-3 text-sm whitespace-pre-wrap text-green-700">
        {value || "—"}
      </div>
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex gap-2">
        {(
          [
            [true, t("pass")],
            [false, t("fail")],
          ] as const
        ).map(([v, txt]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              value === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent",
            )}
          >
            {txt}
          </button>
        ))}
      </div>
    </div>
  );
}
