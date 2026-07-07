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
  createTeamFormSchema,
  type TeamFormValues,
} from "@/entities/team";
import { TEAM_TYPES, type Team } from "@/entities/team";

/**
 * Create a team. SUPERVISION teams are roots (no parent); CONTRACTOR/TESTING
 * teams must attach to an existing SUPERVISION (TVGS) parent — mirroring the
 * team-tree rule in the design doc.
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
  /** Present → edit mode (rename only; type/parent are locked). */
  team?: Team | null;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createTeam = useCreateTeam(projectId);
  const updateTeam = useUpdateTeam();
  const isEdit = Boolean(team);
  const isPending = createTeam.isPending || updateTeam.isPending;

  const supervisionTeams = teams.filter((tm) => tm.teamType === "SUPERVISION");

  const schema = React.useMemo(() => createTeamFormSchema(t), [t]);
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: team?.name ?? "",
      teamType: team?.teamType ?? "SUPERVISION",
      parentTeamId: team?.parentTeamId ?? null,
    },
  });

  const teamType = form.watch("teamType");
  const needsParent = teamType !== "SUPERVISION";

  // Clear the parent when switching to a root type (create mode only).
  React.useEffect(() => {
    if (!isEdit && !needsParent) form.setValue("parentTeamId", null);
  }, [isEdit, needsParent, form]);

  function onSubmit(values: TeamFormValues) {
    if (team) {
      updateTeam.mutate(
        { id: team.id, name: values.name },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? t("teams.edit") : t("teams.add")}
          </DialogTitle>
          <DialogDescription>{t("teams.formDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            {!isEdit ? (
              <FormField
                control={form.control}
                name="teamType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.teamType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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

            {!isEdit && needsParent ? (
              <FormField
                control={form.control}
                name="parentTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.parentTeam")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("form.parentTeamPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supervisionTeams.map((tm) => (
                          <SelectItem key={tm.id} value={tm.id}>
                            {tm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  isPending || (!isEdit && needsParent && supervisionTeams.length === 0)
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
