"use client";

import * as React from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PermissionGate } from "@/shared/ui/permission-gate";
import { MemberRoleBadge } from "@/entities/company-member";
import {
  useCreateProjectMember,
  useDeleteProjectMember,
  useMembers,
  useProjectMembers,
} from "@/features/organization/hooks";
import type { ProjectMember } from "@/features/organization/types";

/**
 * Internal project members (chủ đầu tư side): assign existing company members
 * to the project. They see the whole team tree but don't manage structure.
 */
export function ProjectMembersCard({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  const t = useTranslations("organization");
  const membersQuery = useProjectMembers(projectId);
  const companyMembersQuery = useMembers({
    companyId,
    page: 1,
    pageSize: 100,
    role: "all",
  });
  const createMember = useCreateProjectMember(projectId);
  const deleteMember = useDeleteProjectMember();

  const [picked, setPicked] = React.useState<string>("");
  const [toRemove, setToRemove] = React.useState<ProjectMember | null>(null);

  const assigned = membersQuery.data ?? [];
  const assignedIds = new Set(assigned.map((m) => m.companyMemberId));
  const available = (companyMembersQuery.data?.items ?? []).filter(
    (m) => !assignedIds.has(m.id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5" />
          {t("projectMembers.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-muted-foreground text-sm">{t("projectMembers.hint")}</p>

        <PermissionGate permission="orgs:manage">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={picked} onValueChange={setPicked} disabled={!available.length}>
              <SelectTrigger className="min-w-64">
                <SelectValue placeholder={t("projectMembers.pickPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || m.email} · {t(`roles.${m.role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!picked || createMember.isPending}
              onClick={() =>
                createMember.mutate(picked, { onSuccess: () => setPicked("") })
              }
            >
              <Plus />
              {t("projectMembers.assign")}
            </Button>
          </div>
        </PermissionGate>

        {membersQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : assigned.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            {t("projectMembers.empty")}
          </div>
        ) : (
          <ul className="grid gap-2">
            {assigned.map((member) => (
              <li
                key={member.id}
                className="bg-card flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="grid flex-1">
                  <span className="text-base font-medium">{member.name || "—"}</span>
                  <span className="text-muted-foreground text-xs">{member.email}</span>
                </div>
                <MemberRoleBadge role="COMPANY_MEMBER" />
                <PermissionGate permission="orgs:manage">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("projectMembers.remove")}
                    onClick={() => setToRemove(member)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}

        <ConfirmDialog
          open={toRemove !== null}
          onOpenChange={(o) => !o && setToRemove(null)}
          title={t("projectMembers.removeTitle", { name: toRemove?.name || toRemove?.email || "" })}
          description={t("projectMembers.removeDescription")}
          isPending={deleteMember.isPending}
          onConfirm={() => {
            if (!toRemove) return;
            deleteMember.mutate(toRemove.id, { onSuccess: () => setToRemove(null) });
          }}
        />
      </CardContent>
    </Card>
  );
}
