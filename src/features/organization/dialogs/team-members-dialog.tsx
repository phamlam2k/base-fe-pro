"use client";

import * as React from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PermissionGate } from "@/shared/ui/permission-gate";
import { TeamTypeBadge } from "@/entities/team";
import { TeamMemberFormDialog } from "@/features/organization/dialogs/team-member-form-dialog";
import {
  useDeleteTeamMember,
  useTeamMembers,
} from "@/features/organization/hooks";
import type { Team, TeamMember } from "@/features/organization/types";

function initialsOf(value: string) {
  return value.split(" ").map((p) => p[0]).filter(Boolean).slice(-2).join("").toUpperCase();
}

/** Manage the people inside one team (TVGS / Nhà Thầu / Thí Nghiệm). */
export function TeamMembersDialog({
  open,
  onOpenChange,
  team,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}) {
  const t = useTranslations("organization");
  const format = useFormatter();
  const teamId = team?.id ?? "";
  const membersQuery = useTeamMembers(teamId);
  const deleteMember = useDeleteTeamMember();

  const [addOpen, setAddOpen] = React.useState(false);
  const [toRemove, setToRemove] = React.useState<TeamMember | null>(null);

  const members = membersQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {team ? <TeamTypeBadge type={team.teamType} /> : null}
            {team?.name}
          </DialogTitle>
          <DialogDescription>{t("teamMembers.title")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {t("teamMembers.count", { count: members.length })}
            </span>
            <PermissionGate permission="orgs:manage">
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus />
                {t("teamMembers.add")}
              </Button>
            </PermissionGate>
          </div>

          {membersQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : members.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              {t("teamMembers.empty")}
            </div>
          ) : (
            <ul className="grid max-h-80 gap-2 overflow-y-auto">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="bg-card flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {initialsOf(member.name || member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1">
                    <span className="text-base font-medium">{member.name || "—"}</span>
                    <span className="text-muted-foreground text-xs">{member.email}</span>
                  </div>
                  <span className="text-muted-foreground hidden text-xs sm:block">
                    {t("teamMembers.joinedLabel")}{" "}
                    {format.dateTime(new Date(member.createdAt), { dateStyle: "medium" })}
                  </span>
                  <Badge variant={member.role === "TEAM_LEAD" ? "default" : "outline"}>
                    {t(`teamRoles.${member.role}`)}
                  </Badge>
                  <PermissionGate permission="orgs:manage">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("teamMembers.remove")}
                      onClick={() => setToRemove(member)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </PermissionGate>
                </li>
              ))}
            </ul>
          )}

          {members.length === 0 && !membersQuery.isPending ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <UserRound className="size-3.5" />
              {t("teamMembers.inviteHint")}
            </p>
          ) : null}
        </div>

        {team ? (
          <TeamMemberFormDialog open={addOpen} onOpenChange={setAddOpen} teamId={team.id} />
        ) : null}

        <ConfirmDialog
          open={toRemove !== null}
          onOpenChange={(o) => !o && setToRemove(null)}
          title={t("teamMembers.removeTitle", { name: toRemove?.name || toRemove?.email || "" })}
          description={t("teamMembers.removeDescription")}
          isPending={deleteMember.isPending}
          onConfirm={() => {
            if (!toRemove) return;
            deleteMember.mutate(toRemove.id, { onSuccess: () => setToRemove(null) });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
