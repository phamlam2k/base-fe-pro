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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { UserPicker } from "@/entities/user";
import { useCreateTeamMember } from "../model/hooks";
import {
  createTeamMemberFormSchema,
  type TeamMemberFormValues,
} from "@/entities/team-member";
import { TEAM_ROLES } from "@/entities/team-member";
import type { UserOption } from "@/entities/user";
import type { TeamType } from "@/entities/team";

/**
 * Vai trò nghiệp vụ (User.role) tương ứng loại nhóm → picker chỉ hiện đúng người:
 * nhóm TVGS→supervisor, Nhà thầu→contractor, Thí nghiệm→lab. PACKAGE không thêm người.
 */
const BUSINESS_ROLE_BY_TEAM_TYPE: Partial<Record<TeamType, string>> = {
  SUPERVISION: "supervisor",
  CONTRACTOR: "contractor",
  TESTING: "lab",
};

/** Pick an existing user and add them to a team as Lead or Member. */
export function TeamMemberFormDialog({
  open,
  onOpenChange,
  teamId,
  teamType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamType?: TeamType;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createTeamMember = useCreateTeamMember(teamId);

  const [picked, setPicked] = React.useState<UserOption | null>(null);

  const schema = React.useMemo(() => createTeamMemberFormSchema(t), [t]);
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "TEAM_MEMBER" },
  });

  function onSubmit(values: TeamMemberFormValues) {
    if (!picked) return;
    createTeamMember.mutate(
      { userId: picked.id, role: values.role },
      {
        onSuccess: () => {
          form.reset();
          setPicked(null);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("teamMembers.add")}</DialogTitle>
          <DialogDescription>{t("teamMembers.formDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <Label>{t("form.person")}</Label>
              <UserPicker
                value={picked}
                onChange={setPicked}
                role={teamType ? BUSINESS_ROLE_BY_TEAM_TYPE[teamType] : undefined}
              />
              <p className="text-muted-foreground text-xs">{t("form.personHint")}</p>
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.role")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEAM_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`teamRoles.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTeamMember.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createTeamMember.isPending || !picked}>
                {createTeamMember.isPending ? <Loader2 className="animate-spin" /> : null}
                {tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
