"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header";
import { PermissionGate } from "@/entities/session";
import { usePermission } from "@/entities/session";
import { MemberRoleBadge } from "@/entities/company-member";
import type { Member } from "@/entities/company-member";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();
}

function RowActions({
  member,
  onEdit,
  onDelete,
}: {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}) {
  const t = useTranslations("common");
  const tOrg = useTranslations("organization");
  const { can } = usePermission();

  if (!can("orgs:manage")) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(member)}>
          <Pencil />
          {tOrg("members.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(member)}>
          <Trash2 />
          {tOrg("members.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getMemberColumns({
  t,
  onEdit,
  onDelete,
}: {
  t: (key: string) => string;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}): ColumnDef<Member>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("members.colName")} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">
              {initialsOf(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid">
            <span className="text-base font-medium">{row.original.name}</span>
            <span className="text-muted-foreground text-xs">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("members.colRole"),
      cell: ({ row }) => <MemberRoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "customTitle",
      header: t("members.colTitle"),
      cell: ({ row }) => (
        <span className={row.original.customTitle ? "" : "text-muted-foreground"}>
          {row.original.customTitle || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("members.colJoined")} />
      ),
      cell: ({ row }) => <JoinedCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <PermissionGate permission="orgs:manage">
            <RowActions member={row.original} onEdit={onEdit} onDelete={onDelete} />
          </PermissionGate>
        </div>
      ),
    },
  ];
}

function JoinedCell({ value }: { value: string }) {
  const format = useFormatter();
  return (
    <span className="text-muted-foreground">
      {format.dateTime(new Date(value), { dateStyle: "medium" })}
    </span>
  );
}
