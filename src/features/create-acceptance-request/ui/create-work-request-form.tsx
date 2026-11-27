"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ImagePlus, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { backendErrorMessage } from "@/shared/api/axios";
import { compressToFile } from "@/shared/lib/compress-image";
import { toDatetimeLocalVN } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
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
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/routes";
import { toast } from "sonner";
import {
  acceptanceRequestApi,
  WORK_LEVELS,
  type StagedFile,
} from "@/entities/acceptance-request";
import {
  useCreateAcceptanceRequest,
  useResubmitAcceptanceRequest,
} from "@/features/create-acceptance-request/model/hooks";
import {
  createAcceptanceRequestSchema,
  type AcceptanceRequestValues,
} from "@/features/create-acceptance-request/model/schemas";
import { useSelectedProjectStore } from "@/shared/lib/selected-project";

/**
 * MAD-8/9 — Form tạo phiếu nghiệm thu (bản PC). Khung dùng chung: đổi trường theo
 * loại Vật liệu / Công việc. Bố cục 2 cột: trái = nhập liệu, phải = ảnh + người mời.
 */
export function CreateAcceptanceRequestForm() {
  const t = useTranslations("acceptanceRequest");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // có = SỬA & GỬI LẠI (MAD-13)
  const isEdit = Boolean(editId);
  const basedOnId = searchParams.get("basedOn"); // có = TẠO LẠI từ phiếu bị phủ quyết
  const isBasedOn = Boolean(basedOnId);
  const submit = useCreateAcceptanceRequest();
  const resubmit = useResubmitAcceptanceRequest();
  const pending = submit.isPending || resubmit.isPending;

  // Upload-ngay: ảnh/hoá đơn được đẩy lên staging KHI CHỌN → giữ {key,url,name}.
  const [photos, setPhotos] = React.useState<StagedFile[]>([]);
  const [invoice, setInvoice] = React.useState<StagedFile | null>(null);
  const [docs, setDocs] = React.useState<StagedFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const photoInput = React.useRef<HTMLInputElement>(null);
  const invoiceInput = React.useRef<HTMLInputElement>(null);
  const docsInput = React.useRef<HTMLInputElement>(null);

  async function onPickDocs(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const staged = await acceptanceRequestApi.uploadStaging(files);
      setDocs((d) => [...d, ...staged]);
    } catch (err) {
      toast.error(backendErrorMessage(err) ?? t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function onPickPhotos(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Nén trước khi gửi: ảnh điện thoại vài MB, chọn nhiều ảnh dễ quá thời gian chờ.
      const compressed = await Promise.all(files.map((f) => compressToFile(f)));
      const staged = await acceptanceRequestApi.uploadStaging(compressed);
      setPhotos((p) => [...p, ...staged]);
    } catch (err) {
      toast.error(backendErrorMessage(err) ?? t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function onPickInvoice(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const [staged] = await acceptanceRequestApi.uploadStaging([file]);
      if (staged) setInvoice(staged);
    } catch (err) {
      toast.error(backendErrorMessage(err) ?? t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  // Nhóm nhà thầu lọc theo DỰ ÁN đang chọn → phiếu luôn thuộc đúng dự án.
  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const teamsQuery = useQuery({
    queryKey: ["contractor-teams", projectId],
    queryFn: () => acceptanceRequestApi.contractorTeams(projectId ?? undefined),
    enabled: !isEdit,
  });
  const teams = teamsQuery.data ?? [];

  // Chế độ sửa: tải phiếu cũ để prefill.
  const editQuery = useQuery({
    queryKey: ["acceptance-request", "detail", editId],
    queryFn: () => acceptanceRequestApi.getById(editId!),
    enabled: isEdit,
  });
  // Chế độ tạo lại: tải phiếu bị phủ quyết để prefill (giữ luồng TẠO MỚI).
  const basedOnQuery = useQuery({
    queryKey: ["acceptance-request", "detail", basedOnId],
    queryFn: () => acceptanceRequestApi.getById(basedOnId!),
    enabled: isBasedOn,
  });

  const editProposedAt = toDatetimeLocalVN(editQuery.data?.proposedAt);
  const schema = React.useMemo(
    () => createAcceptanceRequestSchema(t, editProposedAt || undefined),
    [t, editProposedAt],
  );
  const baseDefaults = React.useMemo<AcceptanceRequestValues>(
    () => ({
      type: "material",
      contractorTeam: "",
      invitedSupervisor: "",
      construction: "",
      contractPackage: "",
      category: "",
      location: "",
      proposedAt: "",
      materialType: "",
      quantity: "",
      origin: "",
      needsSampling: false,
      level: "work",
      description: "",
    }),
    [],
  );

  // Auto-điền Hợp đồng đầu tiên + Người mời mặc định NGAY trong render cycle qua prop
  // `values` — KHÔNG dùng setValue trong useEffect: khi react-query trả cache "nóng"
  // lúc điều hướng SPA (vào lại trang), setValue chạy trên instance không phải instance
  // đang hiển thị nên không "ăn" (bug: lần đầu điền được, vào lại thì trống).
  // keepDirtyValues giữ nguyên field user đã tự sửa.
  const firstTeam = teams[0];
  const firstTeamId = firstTeam?.id;
  const firstInviteeId =
    firstTeam?.supervisorLeadId ?? firstTeam?.supervisors?.[0]?.id ?? "";
  // Memo theo ID nguyên thủy → autoValues ỔN ĐỊNH (deep-equal) khi react-query refetch
  // trả cùng dữ liệu, nên RHF không reset đè lên chỉnh sửa của user.
  const autoValues = React.useMemo<AcceptanceRequestValues | undefined>(() => {
    if (isEdit || isBasedOn || !firstTeamId) return undefined;
    return {
      ...baseDefaults,
      contractorTeam: firstTeamId,
      invitedSupervisor: firstInviteeId,
    };
  }, [firstTeamId, firstInviteeId, isEdit, isBasedOn, baseDefaults]);

  const form = useForm<AcceptanceRequestValues>({
    resolver: zodResolver(schema),
    defaultValues: baseDefaults,
    values: autoValues,
  });

  const type = form.watch("type");
  const teamId = form.watch("contractorTeam");
  const selectedTeam = teams.find((tm) => tm.id === teamId);

  // Người theo dõi = thành viên nhóm TVGS phụ trách; mặc định trưởng nhóm.
  const supervisorPeople = selectedTeam?.supervisors ?? [];
  const supPeopleSig = supervisorPeople.map((p) => p.id).join(",");
  const supLeadId = selectedTeam?.supervisorLeadId;
  React.useEffect(() => {
    if (isEdit || isBasedOn) return;
    const people = selectedTeam?.supervisors ?? [];
    if (!people.length) return;
    const cur = form.getValues("invitedSupervisor");
    if (!cur || !people.some((p) => p.id === cur)) {
      form.setValue("invitedSupervisor", supLeadId ?? people[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, supPeopleSig, supLeadId, isEdit, isBasedOn]);

  // Prefill khi sửa & gửi lại (loại phiếu cố định theo phiếu cũ).
  const editData = editQuery.data;
  React.useEffect(() => {
    if (!editData) return;
    form.reset({
      type: editData.type,
      contractorTeam: editData.id, // giữ non-empty để qua validate; resubmit bỏ qua team
      construction: editData.construction ?? "",
      contractPackage: editData.contractPackage ?? "",
      category: editData.category ?? "",
      location: editData.location ?? "",
      proposedAt: toDatetimeLocalVN(editData.proposedAt),
      materialType: editData.materialType ?? "",
      quantity: editData.quantity ?? "",
      origin: (editData as { origin?: string }).origin ?? "",
      needsSampling: editData.needsSampling ?? false,
      level: (editData as { level?: typeof WORK_LEVELS[number]["value"] }).level ?? "work",
      description: editData.description ?? "",
    });
  }, [editData, form]);

  // Prefill khi TẠO LẠI từ phiếu bị phủ quyết (contractorTeam = team phiếu gốc).
  const basedOnData = basedOnQuery.data;
  React.useEffect(() => {
    if (!basedOnData) return;
    form.reset({
      type: basedOnData.type,
      // Mục "Hợp đồng" = vị trí (TVGS + HĐ) → chọn đúng vị trí theo HĐ của phiếu gốc.
      contractorTeam:
        (
          teams.find(
            (tm) =>
              tm.contractorTeamId === basedOnData.contractorTeam &&
              tm.packageName === basedOnData.contractPackage,
          ) ?? teams.find((tm) => tm.contractorTeamId === basedOnData.contractorTeam)
        )?.id ??
        basedOnData.contractorTeam ??
        "",
      construction: basedOnData.construction ?? "",
      contractPackage: basedOnData.contractPackage ?? "",
      category: basedOnData.category ?? "",
      location: basedOnData.location ?? "",
      proposedAt: "",
      materialType: basedOnData.materialType ?? "",
      quantity: basedOnData.quantity ?? "",
      origin: (basedOnData as { origin?: string }).origin ?? "",
      needsSampling: basedOnData.needsSampling ?? false,
      level: (basedOnData as { level?: typeof WORK_LEVELS[number]["value"] }).level ?? "work",
      description: basedOnData.description ?? "",
    });
  }, [basedOnData, teams, form]);

  function onSubmit(values: AcceptanceRequestValues) {
    // Khi tạo mới: ảnh bắt buộc. Khi sửa & gửi lại: ảnh cũ đã có → không bắt buộc.
    if (!isEdit && photos.length === 0) {
      form.setError("root", { message: t("photosRequired") });
      return;
    }
    // TVGS (Người mời) — chỉ áp khi TẠO MỚI (resubmit giữ TVGS cũ):
    // (B) nhóm TVGS của hợp đồng CHƯA có ai → chặn, báo liên hệ Admin.
    // (A) có TVGS nhưng chưa chọn → bắt chọn.
    if (!isEdit) {
      if (supervisorPeople.length === 0) {
        form.setError("root", { message: t("noSupervisorContactAdmin") });
        return;
      }
      if (!values.invitedSupervisor) {
        form.setError("invitedSupervisor", {
          message: t("supervisorRequired"),
        });
        return;
      }
    }
    // Ảnh/hoá đơn/tài liệu đã upload sẵn → gửi kèm KEY (không upload lại lúc submit).
    const photoKeys = photos.map((p) => p.key);
    const invoiceKey = invoice?.key ?? "";
    const attachmentKeys = docs.map((d) => d.key);
    if (isEdit) {
      const isMaterial = values.type === "material";
      resubmit.mutate({
        id: editId!,
        isMaterial,
        input: isMaterial
          ? {
              materialType: values.materialType ?? "",
              quantity: values.quantity ?? "",
              origin: values.origin,
              description: values.description ?? "",
              construction: values.construction,
              category: values.category,
              location: values.location,
              proposedAt: values.proposedAt || null,
              needsSampling: values.needsSampling,
              photoKeys,
              invoiceKey,
              attachmentKeys,
            }
          : {
              level: values.level ?? "work",
              description: values.description ?? "",
              construction: values.construction,
              category: values.category,
              location: values.location,
              proposedAt: values.proposedAt || null,
              needsSampling: values.needsSampling,
              photoKeys,
              attachmentKeys,
            },
      });
      return;
    }
    const basedOn = basedOnId ? { basedOn: basedOnId } : {};
    const input =
      values.type === "material"
        ? {
            type: "material" as const,
            contractorTeam: values.contractorTeam,
            invitedSupervisor: values.invitedSupervisor || undefined,
            materialType: values.materialType ?? "",
            quantity: values.quantity ?? "",
            origin: values.origin,
            description: values.description ?? "",
            construction: values.construction,
            category: values.category,
            location: values.location,
            proposedAt: values.proposedAt || null,
            needsSampling: values.needsSampling,
            photoKeys,
            invoiceKey,
            attachmentKeys,
            ...basedOn,
          }
        : {
            type: "work" as const,
            contractorTeam: values.contractorTeam,
            invitedSupervisor: values.invitedSupervisor || undefined,
            level: values.level ?? "work",
            description: values.description ?? "",
            construction: values.construction,
            category: values.category,
            location: values.location,
            proposedAt: values.proposedAt || null,
            needsSampling: values.needsSampling,
            photoKeys,
            attachmentKeys,
            ...basedOn,
          };
    submit.mutate({ input });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8" noValidate>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {isEdit
              ? t("resubmitTitle")
              : isBasedOn
                ? t("recreateTitle")
                : t("newTitle")}
          </h1>
          <Badge variant="secondary">
            {type === "material" ? t("typeMaterial") : t("typeWork")}
          </Badge>
        </div>

        {/* Chọn loại phiếu — ẩn khi sửa (loại cố định theo phiếu cũ) */}
        {isEdit ? null : (
          <div className="flex gap-2">
            {(["material", "work"] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => form.setValue("type", tp)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  type === tp
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {tp === "material" ? t("typeMaterial") : t("typeWork")}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          {/* Cột trái */}
          <div className="grid gap-4">
            {isEdit ? null : (
              <FormField
                control={form.control}
                name="contractorTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contractPackageSelect")}</FormLabel>
                    <Select
                      value={field.value}
                      // Bỏ qua "" giả từ SelectBubbleInput của Radix lúc mount (nó bắn
                      // onChange rỗng, xoá giá trị đã prefill khi vào lại trang).
                      onValueChange={(v) => v && field.onChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue className="block! min-w-0 truncate" placeholder={t("selectPackage")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[calc(100vw-2rem)]">
                        {teams.map((tm) => (
                          <SelectItem key={tm.id} value={tm.id} title={tm.packageName || tm.name}>
                            {tm.packageName || tm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Gói thầu KHÔNG nhập ở phiếu nữa — tự lấy theo hợp đồng (node Gói thầu
                của cây dự án, khai báo lúc tạo hợp đồng). */}

            <FormItem>
              <FormLabel>{t("locationGroup")}</FormLabel>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["category", "location"] as const).map((n) => (
                  <FormField
                    key={n}
                    control={form.control}
                    name={n}
                    render={({ field }) => (
                      <FormControl>
                        <Input placeholder={t(n)} {...field} />
                      </FormControl>
                    )}
                  />
                ))}
              </div>
            </FormItem>

            {type === "material" ? (
              <>
                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("materialType")}</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Thép D16 (CB300-V)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Đối tượng nghiệm thu — cho phiếu vật liệu cũng nhập như công việc. */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("workDescription")}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quantity")}</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 12 tấn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("origin")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hóa đơn / CO-CQ PDF */}
                <FormItem>
                  <FormLabel>{t("invoicePdf")}</FormLabel>
                  <input
                    ref={invoiceInput}
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      void onPickInvoice(f);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => invoiceInput.current?.click()}
                  >
                    <FileText className="size-4" />
                    {invoice ? invoice.name : t("selectPdf")}
                  </Button>
                </FormItem>

                <FormField
                  control={form.control}
                  name="needsSampling"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>{t("needsSampling")}</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {t("needsSamplingHint")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("level")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORK_LEVELS.map((lvl) => (
                            <SelectItem key={lvl.value} value={lvl.value}>
                              {t(lvl.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("workDescription")}</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* MAD-37 — mời PTN đồng hành kiểm tra hiện trường (không chặn nghiệm thu). */}
                <FormField
                  control={form.control}
                  name="needsSampling"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>{t("needsSamplingWork")}</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          {t("needsSamplingWorkHint")}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="proposedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("proposedAt")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      min={toDatetimeLocalVN(new Date())}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("proposedAtHint")}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tài liệu (PDF) — upload-ngay, nhiều file */}
            <FormItem>
              <FormLabel>{t("documents")}</FormLabel>
              <input
                ref={docsInput}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void onPickDocs(files);
                }}
              />
              <div className="grid gap-1.5">
                {docs.map((d, i) => (
                  <div
                    key={d.key}
                    className="flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm"
                  >
                    <span className="truncate">📄 {d.name}</span>
                    <button
                      type="button"
                      aria-label={t("removePhoto")}
                      onClick={() =>
                        setDocs((list) => list.filter((_, idx) => idx !== i))
                      }
                      className="text-destructive ml-2 shrink-0 px-1 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => docsInput.current?.click()}
                >
                  <FileText className="size-4" /> {t("addDocument")}
                </Button>
              </div>
            </FormItem>
          </div>

          {/* Cột phải: ảnh + người mời */}
          <div className="grid content-start gap-6">
            <div>
              <p className="mb-2 text-sm font-medium uppercase text-muted-foreground">
                {type === "material" ? t("fieldPhotos") : t("completedPhotos")} *
              </p>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void onPickPhotos(files);
                }}
              />
              <div className="flex flex-wrap gap-3">
                {photos.map((f, i) => (
                  <div
                    key={f.key}
                    className="relative size-20 overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.url}
                      alt={f.name}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((p) => p.filter((_, idx) => idx !== i))
                      }
                      className="absolute right-0.5 top-0.5 rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => photoInput.current?.click()}
                  className="flex size-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <ImagePlus className="size-6" />
                </button>
              </div>
              {uploading ? (
                <p className="mt-2 text-xs text-muted-foreground">{t("uploading")}</p>
              ) : null}
            </div>

            {/* Người theo dõi (TVGS) — NT chọn; chỉ người này/trưởng nhóm xác nhận + nghiệm thu. */}
            <FormField
              control={form.control}
              name="invitedSupervisor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium uppercase text-muted-foreground">
                    {t("invitee")}
                    {selectedTeam?.supervisorTeamName
                      ? ` (${selectedTeam.supervisorTeamName})`
                      : ""}
                  </FormLabel>
                  {/* Hợp đồng CHƯA có TVGS → báo liên hệ Admin (không cho chọn). */}
                  {!isEdit && selectedTeam && supervisorPeople.length === 0 ? (
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {t("noSupervisorContactAdmin")}
                    </p>
                  ) : (
                    <>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => v && field.onChange(v)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supervisorPeople.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                isEdit
                  ? ROUTES.acceptanceRequestDetail(editId!)
                  : ROUTES.acceptanceRequests,
              )
            }
            disabled={pending}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? t("resubmit") : t("submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
