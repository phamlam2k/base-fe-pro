"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { usePermission } from "@/providers/session-provider";
import { cn } from "@/lib/utils";
import type { User, UserStatus } from "@/features/users/types";

const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-emerald-500",
  invited: "bg-amber-500",
  suspended: "bg-red-500",
};

function StatusBadge({ status }: { status: UserStatus }) {
  const t = useTranslations("users");
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status])} />
      {t(`statuses.${status}`)}
    </Badge>
  );
}

function RoleBadge({ role }: { role: User["role"] }) {
  const t = useTranslations("users");
  const variant =
    role === "admin" ? "default" : role === "manager" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(`roles.${role}`)}</Badge>;
}

function CreatedAtCell({ value }: { value: string }) {
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

  // No visible actions for this role — render nothing instead of an empty menu.
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
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(user)}
          >
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
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Column factory — receives the `users`-scoped translator and row callbacks
 * so the definitions stay serializable-free and testable.
 */
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
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {initialsOf(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("createdAt")} />
      ),
      cell: ({ row }) => <CreatedAtCell value={row.original.createdAt} />,
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
