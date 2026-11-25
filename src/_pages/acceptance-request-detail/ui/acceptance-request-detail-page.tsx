"use client";

import * as React from "react";
import { FlaskConical, ImageIcon, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ROUTES } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { FileViewer } from "@/shared/ui/file-viewer";
import { ImageGallery } from "@/shared/ui/image-gallery";
import {
  GeolocationButton,
  supportsGeolocationElement,
  type GeolocationResult,
} from "@/shared/ui/geolocation-button";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { checkInsideZone } from "@/shared/lib/geofence";
import { formatDateTime, toDatetimeLocalVN } from "@/shared/lib/format-date";
import { useSession } from "@/entities/session";
import {
  acceptanceRequestApi,
  statusColorClass,
  isRequestOverdue,
} from "@/entities/acceptance-request";
import { pdfTemplateQueries } from "@/entities/pdf-template";
import {
  FieldInspectionDialog,
  useConfirmRequest,
  useConfirmTesting,
  useUploadResult,
  useRequestSupplement,
  useRescheduleRequest,
} from "@/features/review-acceptance-request";

/** MAD-13 — Chi tiết yêu cầu + xác nhận/từ chối (TVGS), wireframe WF7. */
export function AcceptanceRequestDetailPage({ id }: { id: string }) {
  const t = useTranslations("acceptanceRequest");
  const { user } = useSession();
  const router = useRouter();
  const canInspect = canAccessAcceptance(user.role, user.madokaRole, "inspect"); // TVGS
  const canCreate = canAccessAcceptance(user.role, user.madokaRole, "create"); // NT
  const isPtn = user.madokaRole === "lab" || user.role === "admin"; // PTN
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [inspectOpen, setInspectOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  // Dời thời gian nghiệm thu (TVGS).
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [newProposedAt, setNewProposedAt] = React.useState("");
  const [rescheduleReason, setRescheduleReason] = React.useState("");
  const resultInputRef = React.useRef<HTMLInputElement>(null);
  // GPS cho nghiệm thu hiện trường trên WEB (phải trong vùng dự án).
  const [gps, setGps] = React.useState<{ lat: number; lng: number } | null>(null);
  // Popup hướng dẫn bật GPS khi chưa lấy được vị trí lúc bấm nghiệm thu hiện trường.
  const [gpsIssue, setGpsIssue] = React.useState<"denied" | "unavailable" | null>(null);
  const [gpsChecking, setGpsChecking] = React.useState(false);
  const requestGps = React.useCallback(() => {
    return new Promise<{ lat: number; lng: number } | "denied" | "unavailable">((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve("unavailable");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGps(p);
          resolve(p);
        },
        (err) => resolve(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  // MAD-27 — danh sách mẫu PDF để xuất (chỉ nạp khi mở dialog).
  const { data: templates } = useQuery({
    ...pdfTemplateQueries.list(),
    enabled: exportOpen,
  });
  const publishedTemplates = (templates ?? []).filter((tpl) => tpl.isPublished);

  const { data: req, isLoading } = useQuery({
    queryKey: ["acceptance-requests", "detail", id],
    queryFn: () => acceptanceRequestApi.getById(id),
  });
  // MAD-27 — các bản PDF đã xuất từ phiếu (truy vết).
  const { data: pdfExports } = useQuery({
    queryKey: ["acceptance-requests", "pdf-submissions", id],
    queryFn: () => acceptanceRequestApi.pdfSubmissions(id),
  });
  const confirm = useConfirmRequest();
  const confirmTesting = useConfirmTesting();
  const uploadResult = useUploadResult();
  const supplement = useRequestSupplement();
  const reschedule = useRescheduleRequest();
  const busy =
    confirm.isPending ||
    confirmTesting.isPending ||
    supplement.isPending ||
    reschedule.isPending;

  // Vào trang phiếu Đã xác nhận (TVGS) → HỎI GPS ngay để đòi cấp quyền sớm (nếu
  // người dùng quên, lúc bấm Nghiệm thu hiện trường sẽ hỏi lại). Tạo phiếu KHÔNG cần.
  const canInspectStatus = canInspect && req?.status === "confirmed";
  React.useEffect(() => {
    if (canInspectStatus) void requestGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canInspectStatus]);

  if (isLoading || !req) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }

  // Quá thời gian bắt đầu nghiệm thu → khoá nút xác nhận (BE cũng chặn).
  const overdue = isRequestOverdue(req);

  // BẮT BUỘC GPS: xin vị trí; từ chối/không lấy được → mở popup hướng dẫn, thử lại được.
  async function checkGpsThenInspect() {
    setGpsChecking(true);
    const pos = await requestGps();
    setGpsChecking(false);
    onGpsResult(pos);
  }

  function onGpsResult(pos: GeolocationResult) {
    if (typeof pos === "string") {
      setGpsIssue(pos);
      return;
    }
    setGps(pos);
    setGpsIssue(null);
    // Phải NẰM TRONG vùng dự án (chỉ chặn khi dự án đã khoanh vùng).
    const { inside, configured } = checkInsideZone(pos.lat, pos.lng, req?.projectGeofence);
    if (configured && !inside) {
      toast.error(t("gpsOutsideZone"));
      return;
    }
    setInspectOpen(true);
  }

  // Gói thầu + Địa điểm lấy từ dự án (read-only); Hạng mục + Vị trí của phiếu.
  const location = [
    req.projectName,
    req.projectContractPackage,
    req.projectLocation,
    req.category,
    req.location,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {req.code} · {req.type === "material" ? req.materialType : req.description}
        </h1>
        <Badge variant="secondary">{req.typeDisplay}</Badge>
        <Badge variant="outline" className={statusColorClass(req.status)}>
          {req.statusDisplay}
        </Badge>
        {overdue ? (
          <Badge variant="outline" className="border-red-300 text-red-600">
            {t("overdueInspection")}
          </Badge>
        ) : null}
        {/* Chỉ xuất PDF theo mẫu khi phiếu đã Chấp thuận (approved). */}
        {req.status === "approved" ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setExportOpen(true)}
          >
            {t("exportPdf")}
          </Button>
        ) : null}
      </div>

      {req.basedOnCode ? (
        <p className="-mt-3 text-sm text-muted-foreground">
          {t("recreatedFrom")} {req.basedOnCode}
        </p>
      ) : null}

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          <Field label={t("locationGroup")} value={location} />
          {req.type === "material" ? (
            <>
              <Field
                label={t("materialAndQuantity")}
                value={`${req.materialType} - ${req.quantity}`}
              />
              {req.description ? (
                <Field label={t("workDescription")} value={req.description} />
              ) : null}
            </>
          ) : (
            <>
              <Field label={t("level")} value={req.levelDisplay} />
              <Field label={t("workDescription")} value={req.description} />
            </>
          )}
          <Field label={t("proposedAt")} value={formatDateTime(req.proposedAt)} />

          {req.events && req.events.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">{t("history")}</p>
              <ul className="grid gap-2 border-l pl-3 text-sm">
                {[...req.events]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((e) => (
                  <li key={e.id} className="relative">
                    <span className="bg-primary absolute -left-[15px] top-1.5 size-2 rounded-full" />
                    <div className="font-medium text-foreground">{e.actionDisplay}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(e.createdAt)}
                      {e.actorName ? ` · ${e.actorName}` : ""}
                    </div>
                    {e.reason ? (
                      <div className="text-muted-foreground">{e.reason}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="grid content-start gap-6">
          <div>
            <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
              {t("photos")}
            </p>
            {req.photos && req.photos.length > 0 ? (
              <ImageGallery images={req.photos.map((photo) => photo.image)} />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
            )}
            {req.invoice ? (
              <FileViewer
                url={req.invoice}
                name={t("viewInvoice")}
                kind="pdf"
                className="mt-3 inline-block text-sm text-primary underline"
              >
                {t("viewInvoice")}
              </FileViewer>
            ) : null}
          </div>
          {req.needsSampling ? (
            <div className="grid gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-medium">
                <FlaskConical className="size-4" /> {t("needsTestingLabel")}
              </div>
              <div>
                {t("supervisorConfirm")}: {req.supervisorConfirmedAt ? "✓" : "—"}
              </div>
              <div>
                {t("testingConfirm")}: {req.testingConfirmedAt ? "✓" : "—"}
              </div>
              {req.resultFile ? (
                <FileViewer
                  url={req.resultFile}
                  name={req.resultFileName}
                  className="text-primary underline"
                >
                  📄 {req.resultFileName ?? t("viewResultFile")}
                </FileViewer>
              ) : (
                <span>{t("noResultYet")}</span>
              )}
            </div>
          ) : null}

          {pdfExports && pdfExports.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
                {t("exportedPdfs")}
              </p>
              <ul className="grid gap-2">
                {pdfExports.map((pdf) => (
                  <li key={pdf.id} className="text-sm">
                    {pdf.downloadUrl ? (
                      <FileViewer
                        url={pdf.downloadUrl}
                        name={pdf.templateName}
                        kind="pdf"
                        className="text-primary underline"
                      >
                        📄 {pdf.templateName}
                      </FileViewer>
                    ) : (
                      <span>{pdf.templateName}</span>
                    )}
                    <span className="text-muted-foreground">
                      {" · "}
                      {formatDateTime(pdf.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* NT nộp/thay file kết quả thí nghiệm — nút riêng (phiếu Cần thí nghiệm). */}
      {req.needsSampling && canCreate ? (
        <div className="flex justify-end">
          <input
            ref={resultInputRef}
            type="file"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadResult.mutate({ id, file });
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            disabled={uploadResult.isPending}
            onClick={() => resultInputRef.current?.click()}
          >
            <FlaskConical className="size-4" />
            {req.hasResult ? t("replaceResultFile") : t("uploadResultFile")}
          </Button>
        </div>
      ) : null}

      {/* TVGS dời thời gian nghiệm thu khi phiếu CHƯA nghiệm thu xong (kể cả quá hạn). */}
      {canInspect &&
      ["pending", "supplement", "confirmed"].includes(req.status) ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setNewProposedAt(toDatetimeLocalVN(req.proposedAt));
              setRescheduleReason("");
              setRescheduleOpen(true);
            }}
          >
            {t("reschedule")}
          </Button>
        </div>
      ) : null}

      {req.status === "pending" ? (
        <div className="grid gap-2">
          {overdue ? (
            <p className="text-right text-sm text-red-600">
              {t("overdueInspectionNote")}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            {/* PTN xác nhận yêu cầu (phiếu Cần thí nghiệm) */}
            {req.needsSampling && isPtn && !req.testingConfirmedAt ? (
              <Button
                variant="outline"
                disabled={busy || overdue}
                onClick={() => confirmTesting.mutate(id)}
              >
                {t("confirmTesting")}
              </Button>
            ) : null}
            {/* TVGS: yêu cầu bổ sung + xác nhận tiếp nhận */}
            {canInspect ? (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDialogOpen(true)}
                >
                  {t("requestSupplement")}
                </Button>
                {!req.supervisorConfirmedAt ? (
                  <Button disabled={busy || overdue} onClick={() => confirm.mutate(id)}>
                    {t("confirm")}
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {req.status === "confirmed" && canInspect ? (
        <div className="grid gap-2">
          {overdue ? (
            <p className="text-right text-sm text-red-600">
              {t("overdueInspectionBlocked")}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                // Quá hạn → buộc TVGS dời thời gian nghiệm thu trước.
                if (overdue) {
                  toast.error(t("overdueInspectionBlocked"));
                  return;
                }
                // Phiếu cần thí nghiệm nhưng NT chưa nộp file kết quả → chặn.
                if (req.needsSampling && !req.hasResult) {
                  toast.error(t("needResultFileFirst"));
                  return;
                }
                await checkGpsThenInspect();
              }}
            >
              {t("fieldInspection")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* MAD-13 — NT bổ sung & gửi lại phiếu bị 'Yêu cầu bổ sung' */}
      {req.status === "supplement" && canCreate ? (
        <div className="flex justify-end">
          <Button
            onClick={() =>
              router.push(`${ROUTES.acceptanceRequestNew}?edit=${id}`)
            }
          >
            {t("resubmit")}
          </Button>
        </div>
      ) : null}

      {/* Phiếu bị CĐT phủ quyết HOẶC TVGS từ chối → NT tạo phiếu mới dựa trên phiếu này */}
      {(req.status === "vetoed" || req.status === "rejected") && canCreate ? (
        <div className="flex justify-end">
          <Button
            onClick={() =>
              router.push(`${ROUTES.acceptanceRequestNew}?basedOn=${id}`)
            }
          >
            {t("recreate")}
          </Button>
        </div>
      ) : null}

      {/* Phiếu đã nghiệm thu → dẫn sang biên bản (CĐT phủ quyết ở trang biên bản) */}
      {req.recordId ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              router.push(ROUTES.acceptanceRecordDetail(req.recordId!))
            }
          >
            {t("viewRecord")}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={gpsIssue !== null}
        onOpenChange={(open) => {
          if (!open) setGpsIssue(null);
        }}
      >
        <DialogContent overlayClassName="bg-black/70 backdrop-blur-sm supports-backdrop-filter:backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-destructive" />
              {t(gpsIssue === "unavailable" ? "gpsUnavailableTitle" : "gpsDeniedTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              {t(
                gpsIssue === "unavailable"
                  ? "gpsUnavailableDesc"
                  : supportsGeolocationElement()
                    ? "gpsDeniedDescNative"
                    : "gpsDeniedDesc",
              )}
            </p>
            {gpsIssue === "denied" && !supportsGeolocationElement() ? (
              <ol className="list-decimal space-y-1 pl-5">
                <li>{t("gpsDeniedStep1")}</li>
                <li>{t("gpsDeniedStep2")}</li>
                <li>{t("gpsDeniedStep3")}</li>
              </ol>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGpsIssue(null)}>
              {t("gpsLater")}
            </Button>
            {supportsGeolocationElement() ? (
              <GeolocationButton
                onResult={onGpsResult}
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              />
            ) : (
              <Button disabled={gpsChecking} onClick={() => void checkGpsThenInspect()}>
                {gpsChecking ? t("gpsChecking") : t("gpsRetry")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FieldInspectionDialog
        open={inspectOpen}
        onOpenChange={setInspectOpen}
        requestId={id}
        resultFile={req.resultFile}
        resultFileName={req.resultFileName}
        gps={gps}
      />

      {/* MAD-27 — chọn mẫu PDF rồi mở trình điền đã prefill sẵn theo phiếu này. */}
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
                    `${ROUTES.pdfFormFill(tpl.id)}?acceptanceRequestId=${id}`,
                  )
                }
              >
                {tpl.name}
              </Button>
            ))}
            {publishedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noTemplates")}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("supplementReasonTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("supplementReasonPlaceholder")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!reason.trim() || busy}
              onClick={() =>
                supplement.mutate(
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

      {/* Dời thời gian nghiệm thu (TVGS) */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rescheduleTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <span className="text-sm text-muted-foreground">
                {t("proposedAt")}
              </span>
              <Input
                type="datetime-local"
                value={newProposedAt}
                onChange={(e) => setNewProposedAt(e.target.value)}
              />
            </div>
            <Textarea
              rows={3}
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder={t("rescheduleReasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!newProposedAt || busy}
              onClick={() =>
                reschedule.mutate(
                  {
                    id,
                    proposedAt: newProposedAt,
                    reason: rescheduleReason.trim(),
                  },
                  { onSuccess: () => setRescheduleOpen(false) },
                )
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}
