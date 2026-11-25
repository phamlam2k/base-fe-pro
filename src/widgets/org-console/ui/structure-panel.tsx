"use client";

import * as React from "react";
import Link from "next/link";
import {
  CornerDownRight,
  FolderTree,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { PermissionGate } from "@/entities/session";
import { TeamTypeBadge } from "@/entities/team";
import { ProjectFormDialog } from "@/features/manage-project";
import { ProjectMembersCard } from "./project-members-card";
import { TeamFormDialog } from "@/features/manage-team";
import { TeamMembersDialog } from "@/features/manage-team";
import { useQuery } from "@tanstack/react-query";
import { projectQueries } from "@/entities/project";
import { teamQueries } from "@/entities/team";
import { useDeleteProject } from "@/features/manage-project";
import { useDeleteTeam } from "@/features/manage-team";
import { TEAM_TYPES, type Team, type TeamType } from "@/entities/team";
import type { Project } from "@/entities/project";

type ProjectDialog = { mode: "create" } | { mode: "edit"; project: Project } | null;

export function StructurePanel({ companyId }: { companyId: string }) {
  const t = useTranslations("organization");
  const projectsQuery = useQuery(projectQueries.list(companyId));
  const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const deleteProject = useDeleteProject();

  const [picked, setPicked] = React.useState<string | null>(null);
  const [projectDialog, setProjectDialog] = React.useState<ProjectDialog>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);

  const projectId = projects.some((p) => p.id === picked)
    ? (picked as string)
    : (projects[0]?.id ?? "");
  const selectedProject = projects.find((p) => p.id === projectId) ?? null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">{t("projects.pick")}</span>
        <Select value={projectId} onValueChange={setPicked} disabled={!projects.length}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder={t("projects.none")} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedProject ? (
          <PermissionGate permission="orgs:manage">
            <PermissionGate permission="projects:manage-zone">
              <Button asChild variant="ghost" size="sm" aria-label={t("projects.zone")}>
                <Link
                  href={`${ROUTES.projectZone(selectedProject.id)}?name=${encodeURIComponent(selectedProject.name)}`}
                >
                  <MapPin />
                  {t("projects.zone")}
                </Link>
              </Button>
            </PermissionGate>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("projects.edit")}
              onClick={() => setProjectDialog({ mode: "edit", project: selectedProject })}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("projects.delete")}
              onClick={() => setProjectToDelete(selectedProject)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </PermissionGate>
        ) : null}

        <PermissionGate permission="orgs:manage">
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => setProjectDialog({ mode: "create" })}
          >
            <Plus />
            {t("projects.add")}
          </Button>
        </PermissionGate>
      </div>

      {projectsQuery.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : projects.length === 0 ? (
        <EmptyState text={t("projects.empty")} />
      ) : projectId ? (
        <>
          <ProjectMembersCard companyId={companyId} projectId={projectId} />
          <TeamTree projectId={projectId} />
        </>
      ) : null}

      <ProjectFormDialog
        open={projectDialog !== null}
        onOpenChange={(open) => !open && setProjectDialog(null)}
        companyId={companyId}
        project={projectDialog?.mode === "edit" ? projectDialog.project : null}
      />

      <ConfirmDialog
        open={projectToDelete !== null}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        title={t("projects.deleteTitle", { name: projectToDelete?.name ?? "" })}
        description={t("projects.deleteDescription")}
        isPending={deleteProject.isPending}
        onConfirm={() => {
          if (!projectToDelete) return;
          deleteProject.mutate(projectToDelete.id, {
            onSuccess: () => setProjectToDelete(null),
          });
        }}
      />
    </div>
  );
}

type TeamDialog = { mode: "create" } | { mode: "edit"; team: Team } | null;

function TeamTree({ projectId }: { projectId: string }) {
  const t = useTranslations("organization");
  const teamsQuery = useQuery(teamQueries.list(projectId));
  const teams = teamsQuery.data ?? [];
  const deleteTeam = useDeleteTeam();

  const [teamDialog, setTeamDialog] = React.useState<TeamDialog>(null);
  const [membersTeam, setMembersTeam] = React.useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = React.useState<Team | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<TeamType | "all">("all");

  const roots = teams.filter((tm) => tm.parentTeamId === null);
  // 1 nhóm có thể nằm dưới nhiều cha: con của `parent` trong ngữ cảnh Hợp đồng
  // `packageId` = nhóm có vị trí (parent, packageId) — NT dưới TVGS chỉ hiện ở đúng HĐ.
  const childrenOf = (parent: Team, packageId: string | null) =>
    teams.filter((tm) =>
      tm.placements.length
        ? tm.placements.some(
            (pl) =>
              pl.parentId === parent.id &&
              (parent.teamType === "PACKAGE" || !packageId || pl.packageId === packageId),
          )
        : tm.parentTeamId === parent.id,
    );
  const filtered = teams.filter((tm) => tm.teamType === typeFilter);

  const rowActions = {
    onManage: setMembersTeam,
    onEdit: (team: Team) => setTeamDialog({ mode: "edit", team }),
    onDelete: setTeamToDelete,
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderTree className="size-5" />
          {t("teams.title")}
        </CardTitle>
        <PermissionGate permission="orgs:manage">
          <Button size="sm" onClick={() => setTeamDialog({ mode: "create" })}>
            <Plus />
            {t("teams.add")}
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* C4 — per-type filter */}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            {t("teams.filterAll")}
          </FilterChip>
          {TEAM_TYPES.map((type) => (
            <FilterChip
              key={type}
              active={typeFilter === type}
              onClick={() => setTypeFilter(type)}
            >
              {t(`teamTypes.${type}`)}
            </FilterChip>
          ))}
        </div>

        {teamsQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : teams.length === 0 ? (
          <EmptyState text={t("teams.empty")} />
        ) : typeFilter !== "all" ? (
          // Flat list of one type (quản lý riêng TVGS / Nhà Thầu / Thí Nghiệm)
          filtered.length === 0 ? (
            <EmptyState text={t("teams.emptyType")} />
          ) : (
            <div className="grid gap-2">
              {filtered.map((team) => (
                <TeamRow key={team.id} team={team} {...rowActions} />
              ))}
            </div>
          )
        ) : (
          // Full tree (đệ quy: Gói thầu → TVGS → Nhà Thầu/Thí Nghiệm)
          roots.map((root) => (
            <TeamSubtree
              key={root.id}
              team={root}
              packageId={root.teamType === "PACKAGE" ? root.id : null}
              childrenOf={childrenOf}
              depth={0}
              actions={rowActions}
              noChildrenLabel={t("teams.noChildren")}
            />
          ))
        )}
      </CardContent>

      <TeamFormDialog
        open={teamDialog !== null}
        onOpenChange={(open) => !open && setTeamDialog(null)}
        projectId={projectId}
        teams={teams}
        team={teamDialog?.mode === "edit" ? teamDialog.team : null}
      />

      <TeamMembersDialog
        open={membersTeam !== null}
        onOpenChange={(open) => !open && setMembersTeam(null)}
        team={membersTeam}
      />

      <ConfirmDialog
        open={teamToDelete !== null}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title={t("teams.deleteTitle", { name: teamToDelete?.name ?? "" })}
        description={
          teamToDelete?.teamType === "PACKAGE" ||
          teamToDelete?.teamType === "SUPERVISION"
            ? t("teams.deleteRootDescription")
            : t("teams.deleteDescription")
        }
        isPending={deleteTeam.isPending}
        onConfirm={() => {
          if (!teamToDelete) return;
          deleteTeam.mutate(teamToDelete.id, {
            onSuccess: () => setTeamToDelete(null),
          });
        }}
      />
    </Card>
  );
}

type RowActions = {
  onManage: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
};

/** Đệ quy render 1 nhánh cây: Gói thầu → TVGS → Nhà Thầu/Thí Nghiệm. */
function TeamSubtree({
  team,
  packageId,
  childrenOf,
  depth,
  actions,
  noChildrenLabel,
}: {
  team: Team;
  /** Hợp đồng của nhánh đang vẽ (gốc PACKAGE). */
  packageId: string | null;
  childrenOf: (parent: Team, packageId: string | null) => Team[];
  depth: number;
  actions: RowActions;
  noChildrenLabel: string;
}) {
  const children = childrenOf(team, packageId);
  // Gói thầu / TVGS chưa có nhóm con → hiển thị dòng gợi ý.
  const showEmpty =
    (team.teamType === "PACKAGE" || team.teamType === "SUPERVISION") &&
    children.length === 0;
  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-2">
        {depth > 0 ? (
          <CornerDownRight className="text-muted-foreground mt-2.5 size-4 shrink-0" />
        ) : null}
        <TeamRow team={team} {...actions} />
      </div>
      {children.length > 0 || showEmpty ? (
        <div className="ml-6 grid gap-2 border-l pl-4">
          {showEmpty ? (
            <p className="text-muted-foreground py-1 text-sm">{noChildrenLabel}</p>
          ) : (
            children.map((child) => (
              <TeamSubtree
                key={child.id}
                team={child}
                packageId={packageId}
                childrenOf={childrenOf}
                depth={depth + 1}
                actions={actions}
                noChildrenLabel={noChildrenLabel}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function TeamRow({
  team,
  onManage,
  onEdit,
  onDelete,
}: {
  team: Team;
  onManage: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}) {
  const t = useTranslations("organization");
  return (
    <div className="bg-card flex flex-1 flex-wrap items-center gap-3 rounded-lg border p-3">
      <TeamTypeBadge type={team.teamType} />
      <span className="text-base font-medium">{team.name}</span>
      <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Users className="size-4" />
        {t("teams.memberCount", { count: team.memberCount })}
      </span>
      <div className="ml-auto flex items-center gap-1">
        {/* Gói thầu chỉ là nhóm cha — không thêm thành viên, chỉ thêm nhóm con. */}
        {team.teamType !== "PACKAGE" ? (
          <Button variant="outline" size="sm" onClick={() => onManage(team)}>
            <UsersRound />
            {t("teamMembers.manage")}
          </Button>
        ) : null}
        <PermissionGate permission="orgs:manage">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("teams.edit")}
            onClick={() => onEdit(team)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("teams.delete")}
            onClick={() => onDelete(team)}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
      {text}
    </div>
  );
}
