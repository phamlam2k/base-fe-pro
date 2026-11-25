"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useCreateTeam, useUpdateTeam } from "../model/hooks";
import {
  TEAM_TYPES,
  createTeamFormSchema,
  placementKey,
  placementOptions,
  type Team,
  type TeamFormValues,
} from "@/entities/team";

/**
 * Create / edit a team. PACKAGE (Hợp đồng) teams are roots (no parent); a
 * SUPERVISION team belongs to ONE OR MORE contracts; a CONTRACTOR/TESTING team
 * sits under one or more "TVGS · Hợp đồng" placements (PACKAGE → SUPERVISION → NT/PTN).
 */
export function TeamFormDialog({
  open,
  onOpenChange,
  projectId,
  teams,
  team,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  teams: Team[];
  /** Present → edit mode (rename + change placements; type is locked). */
  team?: Team | null;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createTeam = useCreateTeam(projectId);
  const updateTeam = useUpdateTeam();
  const isEdit = Boolean(team);
  const isPending = createTeam.isPending || updateTeam.isPending;

  const schema = React.useMemo(() => createTeamFormSchema(t), [t]);
  const valuesFor = React.useCallback(
    (tm: Team | null | undefined): TeamFormValues => ({
      name: tm?.name ?? "",
      teamType: tm?.teamType ?? "PACKAGE",
      placementKeys: tm?.placements.map((pl) => placementKey(pl.parentId, pl.packageId)) ?? [],
    }),
    [],
  );
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(team),
  });

  // Dialog luôn được mount sẵn → defaultValues chỉ chạy 1 lần. Mỗi lần MỞ (hoặc đổi
  // nhóm đang sửa) phải nạp lại tên + các vị trí hiện có của nhóm đó.
  const teamId = team?.id;
  React.useEffect(() => {
    if (open) form.reset(valuesFor(team));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ nạp lại khi mở / đổi nhóm
  }, [open, teamId]);

  const teamType = form.watch("teamType");
  const needsParent = teamType !== "PACKAGE";
  // TVGS → các Hợp đồng; Nhà Thầu/Thí Nghiệm → các cặp "TVGS · Hợp đồng".
  // Khi sửa: vị trí đang có mà không còn trong danh sách (dữ liệu cũ) vẫn hiện để bỏ chọn được.
  const parentOptions = React.useMemo(() => {
    const opts = placementOptions(teamType, teams);
    const known = new Set(opts.map((o) => o.key));
    const stray = (team?.placements ?? [])
      .map((pl) => ({
        key: placementKey(pl.parentId, pl.packageId),
        label:
          teamType === "SUPERVISION" || !pl.packageName
            ? pl.parentName
            : `${pl.parentName} · ${pl.packageName}`,
      }))
      .filter((o) => !known.has(o.key));
    return [...opts, ...stray];
  }, [teamType, teams, team]);

  // Đổi loại nhóm (chỉ khi tạo) → xoá vị trí đã chọn: cha hợp lệ của loại này không
  // hợp lệ cho loại khác (vd Hợp đồng làm cha của Nhà Thầu).
  const typeChanged = React.useRef(false);
  React.useEffect(() => {
    if (isEdit) return;
    if (typeChanged.current) form.setValue("placementKeys", []);
    typeChanged.current = true;
  }, [isEdit, teamType, form]);

  function onSubmit(values: TeamFormValues) {
    if (team) {
      updateTeam.mutate(
        {
          id: team.id,
          name: values.name,
          ...(needsParent ? { placementKeys: values.placementKeys } : {}),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createTeam.mutate(values, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? t("teams.edit") : t("teams.add")}
          </DialogTitle>
          <DialogDescription>{t("teams.formDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 gap-4 *:min-w-0" noValidate>
            {!isEdit ? (
              <FormField
                control={form.control}
                name="teamType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.teamType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue className="block! min-w-0 truncate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEAM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`teamTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {needsParent ? (
              <FormField
                control={form.control}
                name="placementKeys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.parentTeam")}</FormLabel>
                    {parentOptions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t("form.parentTeamEmpty")}
                      </p>
                    ) : (
                      <div className="grid max-h-56 min-w-0 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-2">
                        {parentOptions.map((opt) => {
                          const checked = field.value.includes(opt.key);
                          return (
                            <label
                              key={opt.key}
                              className="hover:bg-muted flex min-w-0 cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm"
                              title={opt.label}
                            >
                              <Checkbox
                                className="shrink-0"
                                checked={checked}
                                onCheckedChange={(next) =>
                                  field.onChange(
                                    next
                                      ? [...field.value, opt.key]
                                      : field.value.filter((k) => k !== opt.key),
                                  )
                                }
                              />
                              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <FormDescription>{t("form.parentTeamHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {!isEdit && !needsParent ? (
              <p className="text-muted-foreground text-sm">{t("teams.rootHint")}</p>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.teamName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.teamNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending || (needsParent && parentOptions.length === 0)
                }
              >
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {isEdit ? tCommon("save") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
