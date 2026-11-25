"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PermissionGate } from "@/entities/session";
import { MemberRoleBadge } from "@/entities/company-member";
import { useQuery } from "@tanstack/react-query";
import { companyMemberQueries } from "@/entities/company-member";
import { projectMemberQueries } from "@/entities/project-member";
import { useCreateProjectMember, useDeleteProjectMember } from "@/features/manage-project-member";
import type { ProjectMember } from "@/entities/project-member";

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
  const membersQuery = useQuery(projectMemberQueries.list(projectId));
  const companyMembersQuery = useQuery(
    companyMemberQueries.list({
      companyId,
      page: 1,
      pageSize: 100,
      role: "all",
    }),
  );
  const createMember = useCreateProjectMember(projectId);
  const deleteMember = useDeleteProjectMember();

  const [picked, setPicked] = React.useState<string>("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [toRemove, setToRemove] = React.useState<ProjectMember | null>(null);

  const assigned = membersQuery.data ?? [];
  const assignedIds = new Set(assigned.map((m) => m.companyMemberId));
  // CHỈ CĐT: người gán vào dự án (bên chủ đầu tư) phải có vai trò nghiệp vụ = investor.
  const available = (companyMembersQuery.data?.items ?? []).filter(
    (m) => !assignedIds.has(m.id) && m.businessRole === "investor",
  );
  const pickedMember = available.find((m) => m.id === picked);

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
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  disabled={!available.length}
                  className="min-w-64 justify-between font-normal"
                >
                  <span className={cn("truncate", !pickedMember && "text-muted-foreground")}>
                    {pickedMember
                      ? `${pickedMember.name || pickedMember.email} · ${t(`roles.${pickedMember.role}`)}`
                      : t("projectMembers.pickPlaceholder")}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("projectMembers.searchPlaceholder")} />
                  <CommandList>
                    <CommandEmpty>{t("projectMembers.noneFound")}</CommandEmpty>
                    <CommandGroup>
                      {available.map((m) => (
                        <CommandItem
                          key={m.id}
                          value={`${m.name} ${m.email} ${t(`roles.${m.role}`)}`}
                          onSelect={() => {
                            setPicked(m.id);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              picked === m.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {m.name || m.email} · {t(`roles.${m.role}`)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              disabled={!picked || createMember.isPending}
              onClick={() =>
                createMember.mutate(picked, {
                  onSuccess: () => setPicked(""),
                })
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
