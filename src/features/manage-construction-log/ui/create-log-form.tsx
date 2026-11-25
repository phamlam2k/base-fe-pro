"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Textarea } from "@/shared/ui/textarea";
import { ROUTES } from "@/shared/config/routes";
import { acceptanceRequestApi } from "@/entities/acceptance-request";
import { useSelectedProjectStore } from "@/shared/lib/selected-project";
import { constructionLogApi } from "@/entities/construction-log";
import { useCreateLog } from "@/features/manage-construction-log/model/hooks";

const schema = z.object({
  contractorTeam: z.string().min(1),
  supervisorTeam: z.string().min(1),
  invitedSupervisor: z.string().min(1),
  logDate: z.string().min(1),
  weather: z.string().optional(),
  documents: z.string().optional(),
  commandCount: z.string().optional(),
  workerCount: z.string().optional(),
  securityCount: z.string().optional(),
  equipment: z.string().optional(),
  materials: z.string().optional(),
  workDone: z.string().optional(),
  note: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const toNum = (v?: string) => (v && v.trim() ? Number(v) : null);

/** MAD-10 — Form khai báo nhật ký thi công (NT). */
export function CreateLogForm() {
  const t = useTranslations("constructionLog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const create = useCreateLog();

  // Nhóm nhà thầu lọc theo DỰ ÁN đang chọn → nhật ký luôn thuộc đúng dự án.
  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const teamsQuery = useQuery({
    queryKey: ["contractor-teams", projectId],
    queryFn: () => acceptanceRequestApi.contractorTeams(projectId ?? undefined),
  });
  const teams = teamsQuery.data ?? [];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractorTeam: "",
      supervisorTeam: "",
      invitedSupervisor: "",
      // Ngày theo LỊCH VIỆT NAM (UTC+7) — tránh lệch sang hôm trước khi 0h–7h VN.
      logDate: new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10),
      weather: "",
      documents: "",
      commandCount: "",
      workerCount: "",
      securityCount: "",
      equipment: "",
      materials: "",
      workDone: "",
      note: "",
    },
  });

  function onSubmit(v: Values) {
    create.mutate({
      contractorTeam: v.contractorTeam,
      supervisorTeam: v.supervisorTeam,
      invitedSupervisor: v.invitedSupervisor,
      logDate: v.logDate,
      weather: v.weather,
      documents: v.documents,
      commandCount: toNum(v.commandCount),
      workerCount: toNum(v.workerCount),
      securityCount: toNum(v.securityCount),
      equipment: v.equipment,
      materials: v.materials,
      workDone: v.workDone,
      note: v.note,
    });
  }

  // Team NT đang chọn → danh sách nhóm TVGS để chọn phụ trách.
  const contractorTeam = form.watch("contractorTeam");
  const logDate = form.watch("logDate");
  const supervisorTeam = form.watch("supervisorTeam");
  const selectedTeam = teams.find((tm) => tm.id === contractorTeam);
  const supervisorOptions = selectedTeam?.supervisorTeams ?? [];
  // Người theo dõi = thành viên của nhóm TVGS đang chọn.
  const selectedSupTeam = supervisorOptions.find((st) => st.id === supervisorTeam);
  const supervisorPeople = selectedSupTeam?.members ?? [];

  // Preview "Công tác nghiệm thu" — biên bản đã Chấp thuận của team NT trong ngày (KHÓA).
  const dailyPreview = useQuery({
    queryKey: ["daily-acceptance-preview", contractorTeam, logDate],
    queryFn: () => constructionLogApi.dailyAcceptancePreview(contractorTeam, logDate),
    enabled: !!contractorTeam && !!logDate,
  });
  const dailyRecords = dailyPreview.data ?? [];

  // Đặt team NT mặc định + đặt lại TVGS mặc định khi đổi team (hoặc lựa chọn
  // hiện tại không còn thuộc team NT). Tránh gửi TVGS của gói thầu khác.
  React.useEffect(() => {
    if (!teams.length) return;
    if (!contractorTeam) {
      form.setValue("contractorTeam", teams[0].id);
      return;
    }
    const team = teams.find((tm) => tm.id === contractorTeam);
    const opts = team?.supervisorTeams ?? [];
    const cur = form.getValues("supervisorTeam");
    if (!cur || !opts.some((o) => o.id === cur)) {
      form.setValue("supervisorTeam", team?.supervisorTeamId ?? opts[0]?.id ?? "");
    }
  }, [teams, contractorTeam, form]);

  // Đổi nhóm TVGS → đặt lại người theo dõi mặc định (trưởng nhóm), hoặc giữ nếu vẫn hợp lệ.
  React.useEffect(() => {
    const people = selectedSupTeam?.members ?? [];
    const cur = form.getValues("invitedSupervisor");
    if (!cur || !people.some((p) => p.id === cur)) {
      form.setValue(
        "invitedSupervisor",
        selectedSupTeam?.defaultSupervisorId ?? people[0]?.id ?? "",
      );
    }
  }, [supervisorTeam, selectedSupTeam, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 md:max-w-2xl"
        noValidate
      >
        <h1 className="text-2xl font-semibold">{t("newLog")}</h1>

        <FormField
          control={form.control}
          name="contractorTeam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contractor")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue className="block! min-w-0 truncate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  {teams.map((tm) => (
                    <SelectItem key={tm.id} value={tm.id} title={tm.packageName ? `${tm.name} · ${tm.packageName}` : tm.name}>
                      {tm.packageName ? `${tm.name} · ${tm.packageName}` : tm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supervisorTeam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("supervisorTeam")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSupervisorTeam")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supervisorOptions.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invitedSupervisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("invitedSupervisor")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectInvitedSupervisor")} />
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
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("logDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weather"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("weather")}</FormLabel>
              <FormControl>
                <Input placeholder="VD: Nắng, 32°C" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="documents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("documents")}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="equipment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("equipment")}</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Máy móc thiết bị đang hoạt động" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Nhân sự — 3 ô số lượng */}
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["commandCount", "commandCount"],
              ["workerCount", "workerCount"],
              ["securityCount", "securityCount"],
            ] as const
          ).map(([name, key]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(key)}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>
        <FormField
          control={form.control}
          name="materials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("materials")}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workDone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workDone")}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* "Công tác nghiệm thu" KHÔNG nhập tay — tự lấy danh sách biên bản Chấp thuận
            của team NT trong ngày (preview theo team + ngày đang chọn). */}
        <div className="grid gap-1.5">
          <FormLabel>{t("acceptanceWork")}</FormLabel>
          {dailyRecords.length ? (
            <ul className="bg-muted/50 grid gap-1.5 rounded-md p-3 text-sm">
              {dailyRecords.map((r) => (
                <li key={r.code} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">{r.code}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{r.category || "—"}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{r.time}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="bg-background rounded px-1.5 py-0.5 text-xs">
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
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("note")}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.constructionLogs)}
            disabled={create.isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" /> : null}
            {t("submitLog")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
