"use client";

import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
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
import { cn } from "@/shared/lib/utils";
import type { User } from "@/features/users/types";

function RoleBadge({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const t = useTranslations("users");
  if (isSuperAdmin) {
    return (
      <Badge className="gap-1">
        <ShieldCheck className="size-3.5" />
        {t("superAdmin")}
      </Badge>
    );
  }
  return <Badge variant="outline">{t("normalUser")}</Badge>;
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations("users");
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-red-500",
        )}
      />
      {t(isActive ? "active" : "inactive")}
    </Badge>
  );
}

function JoinedCell({ value }: { value: string }) {
  const format = useFormatter();
  return (
    <span className="text-muted-foreground">
      {format.dateTime(new Date(value), { dateStyle: "medium" })}
    </span>
  );
}

function RowActions({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const t = useTranslations("common");
  const tUsers = useTranslations("users");
  const { canAny } = usePermission();
  if (!canAny(["users:update", "users:delete"])) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permission="users:update">
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Pencil />
            {tUsers("editUser")}
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permission="users:delete">
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
            <Trash2 />
            {tUsers("deleteUser")}
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();
}

export function getUserColumns({
  t,
  onEdit,
  onDelete,
}: {
  t: (key: string) => string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("name")} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">
              {initialsOf(row.original.name || row.original.email)}
            </AvatarFallback>
          </Avatar>
          <div className="grid">
            <span className="text-base font-medium">
              {row.original.name || "—"}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("phone"),
      cell: ({ row }) => (
        <span className={row.original.phone ? "" : "text-muted-foreground"}>
          {row.original.phone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "isSuperAdmin",
      header: t("roleColumn"),
      cell: ({ row }) => <RoleBadge isSuperAdmin={row.original.isSuperAdmin} />,
    },
    {
      accessorKey: "isActive",
      header: t("statusColumn"),
      cell: ({ row }) => <ActiveBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("createdAt")} />
      ),
      cell: ({ row }) => <JoinedCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <RowActions user={row.original} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ),
    },
  ];
}
