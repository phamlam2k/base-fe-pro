"use client";

import * as React from "react";
import { FileText, ImagePlus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { FileViewer } from "@/shared/ui/file-viewer";
import {
  FaceSignDialog,
  type FaceSignResult,
} from "@/shared/ui/face-sign-dialog";
import {
  acceptanceRequestApi,
  INSPECTION_RESULTS,
  type InspectionResultValue,
  type RemediationItemInput,
  type StagedFile,
} from "@/entities/acceptance-request";
import { backendErrorMessage } from "@/shared/api/axios";
import { compressToFile } from "@/shared/lib/compress-image";
import { usePerformInspection } from "@/features/review-acceptance-request/model/hooks";

// TẠM MAD-7: đặt false để tạm bỏ bắt buộc quét mặt khi nghiệm thu (test luồng).
// Đổi lại true khi hoàn thiện xác thực sinh trắc.
const REQUIRE_BIOMETRIC = false;

/** MAD-14 — Dialog thực hiện nghiệm thu hiện trường (bản PC). */
export function FieldInspectionDialog({
  open,
  onOpenChange,
  requestId,
  resultFile,
  resultFileName,
  gps,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  /** File kết quả thí nghiệm NT đã nộp — TVGS xem/tải để quyết định. */
  resultFile?: string | null;
  resultFileName?: string | null;
  /** Toạ độ GPS của máy TVGS (đã xác nhận trong vùng) — gửi kèm khi hoàn tất. */
  gps?: { lat: number; lng: number } | null;
}) {
  const t = useTranslations("acceptanceRequest");
  const perform = usePerformInspection();

  const [result, setResult] = React.useState<InspectionResultValue>("approved");
  // Upload-ngay: ảnh hiện trường đẩy lên staging khi chọn → giữ {key,url,name}.
  const [photos, setPhotos] = React.useState<StagedFile[]>([]);
  const [reason, setReason] = React.useState("");
  const [outside, setOutside] = React.useState(false);
  const [signature, setSignature] = React.useState<FaceSignResult | null>(null);
  const [faceOpen, setFaceOpen] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  const [docs, setDocs] = React.useState<StagedFile[]>([]);
  const [pickingDocs, setPickingDocs] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const docsRef = React.useRef<HTMLInputElement>(null);

  async function onPickDocs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setPickingDocs(true);
    try {
      const staged = await acceptanceRequestApi.uploadStaging(files);
      setDocs((d) => [...d, ...staged]);
    } catch (err) {
      toast.error(backendErrorMessage(err) ?? t("uploadFailed"));
    } finally {
      setPickingDocs(false);
    }
  }
  const [items, setItems] = React.useState<RemediationItemInput[]>([
    { criterion: "", passed: true, reason: "" },
  ]);
  // Ghi mốc BẮT ĐẦU phiên nghiệm thu khi mở dialog (kết thúc do backend đặt).
  const startedAtRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (open && !startedAtRef.current) startedAtRef.current = new Date().toISOString();
    if (!open) startedAtRef.current = null;
  }, [open]);

  function updateItem(i: number, patch: Partial<RemediationItemInput>) {
    setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại cùng file
    if (files.length === 0) return;
    setPicking(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressToFile(f)));
      const staged = await acceptanceRequestApi.uploadStaging(compressed);
      setPhotos((p) => [...p, ...staged]);
    } catch (err) {
      toast.error(backendErrorMessage(err) ?? t("uploadFailed"));
    } finally {
      setPicking(false);
    }
  }

  function submit() {
    if (photos.length === 0) return toast.error(t("photosRequired"));
    // TẠM MAD-7: đặt false để tạm bỏ bắt buộc quét mặt khi nghiệm thu (test luồng).
    if (REQUIRE_BIOMETRIC && !signature) return toast.error(t("signRequired"));
    perform.mutate(
      {
        id: requestId,
        input: {
          result,
          fieldPhotos: photos.map((p) => p.key),
          reason: reason.trim(),
          gpsOutsideRadius: outside,
          signaturePhoto: signature?.photo ?? "",
          // GPS máy TVGS (đã kiểm trong vùng) → backend enforce lại geofence.
          gpsLat: gps?.lat ?? signature?.gpsLat,
          gpsLng: gps?.lng ?? signature?.gpsLng,
          remediationItems:
            result === "remediate"
              ? items.filter((it) => it.criterion.trim())
              : undefined,
          startedAt: startedAtRef.current ?? undefined,
          attachmentKeys: docs.map((d) => d.key),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("fieldInspectionTitle")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {resultFile ? (
            <FileViewer
              url={resultFile}
              name={resultFileName}
              className="text-primary flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm underline"
            >
              <FileText className="size-4" /> {resultFileName ?? t("viewResultFile")}
            </FileViewer>
          ) : null}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">{t("inspectionResult")}</label>
            <Select value={result} onValueChange={(v) => setResult(v as InspectionResultValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_RESULTS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              {t("fieldPhotos")} * ({photos.length})
            </label>
            <p className="text-xs text-muted-foreground">{t("fieldPhotosHint")}</p>
            {photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div key={p.key} className="relative">
                    {/* Ảnh đã upload → hiển thị bằng URL presigned. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.name}
                      className="h-16 w-full rounded border object-cover"
                    />
                    <button
                      type="button"
                      aria-label={t("removePhoto")}
                      onClick={() =>
                        setPhotos((p) => p.filter((_, idx) => idx !== i))
                      }
                      className="bg-background/90 absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border text-xs leading-none shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onPickPhotos}
            />
            <Button
              type="button"
              variant="outline"
              disabled={picking}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" />{" "}
              {picking ? t("addingPhoto") : t("addPhoto")}
            </Button>
          </div>

          {/* Tài liệu (PDF) — upload-ngay, nhiều file */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              {t("documents")} ({docs.length})
            </label>
            {docs.map((d, i) => (
              <div
                key={d.key}
                className="flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm"
              >
                <span className="truncate">📄 {d.name}</span>
                <button
                  type="button"
                  aria-label={t("removePhoto")}
                  onClick={() => setDocs((list) => list.filter((_, idx) => idx !== i))}
                  className="text-destructive ml-2 shrink-0 px-1 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            <input
              ref={docsRef}
              type="file"
              accept="application/pdf"
              multiple
              hidden
              onChange={onPickDocs}
            />
            <Button
              type="button"
              variant="outline"
              disabled={pickingDocs}
              onClick={() => docsRef.current?.click()}
            >
              <FileText className="size-4" />{" "}
              {pickingDocs ? t("uploading") : t("addDocument")}
            </Button>
          </div>

          {result === "remediate" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("checklist")}</label>
              {items.map((it, i) => (
                <div key={i} className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t("criterion")}
                      value={it.criterion}
                      onChange={(e) => updateItem(i, { criterion: e.target.value })}
                    />
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-sm">{t("passed")}</span>
                      <Switch
                        checked={it.passed}
                        onCheckedChange={(v) => updateItem(i, { passed: v })}
                      />
                    </div>
                  </div>
                  {!it.passed ? (
                    <Input
                      placeholder={t("failReason")}
                      value={it.reason}
                      onChange={(e) => updateItem(i, { reason: e.target.value })}
                    />
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((l) => [...l, { criterion: "", passed: true, reason: "" }])
                }
              >
                <Plus className="size-4" /> {t("addCriterion")}
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm">{t("gpsOutside")}</span>
            <Switch checked={outside} onCheckedChange={setOutside} />
          </div>

          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              result === "rejected"
                ? t("rejectReason")
                : outside
                  ? t("gpsExplain")
                  : t("noteOptional")
            }
          />

          {/* Ký sinh trắc học — ẩn khi không bắt buộc (REQUIRE_BIOMETRIC=false). Bật
              lại cờ (khớp backend REQUIRE_SIGNATURE_BIOMETRIC) là nút + dialog tự hiện. */}
          {REQUIRE_BIOMETRIC ? (
            <Button
              type="button"
              variant={signature ? "default" : "outline"}
              onClick={() => setFaceOpen(true)}
            >
              {signature ? t("signed") : t("signBiometric")}
            </Button>
          ) : null}
        </div>

        {REQUIRE_BIOMETRIC ? (
          <FaceSignDialog
            open={faceOpen}
            onOpenChange={setFaceOpen}
            onCaptured={setSignature}
            labels={{
              title: t("faceSignTitle"),
              hint: t("faceSignHint"),
              capture: t("faceSignCapture"),
              cancel: t("cancel"),
              cameraError: t("faceSignCameraError"),
            }}
          />
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button disabled={perform.isPending} onClick={submit}>
            {t("completeInspection")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
