"use client";

import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { formatDate } from "@/shared/lib/format-date";

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
import type { User } from "@/entities/user";

/** Cột "Quyền": SuperAdmin > Quản trị viên (COMPANY_ADMIN/DELEGATE) > Nhân viên. */
function PermBadge({
  isSuperAdmin,
  companyRole,
}: {
  isSuperAdmin: boolean;
  companyRole?: string;
}) {
  const t = useTranslations("users");
  if (isSuperAdmin) {
    return (
      <Badge className="gap-1">
        <ShieldCheck className="size-3.5" />
        {t("superAdmin")}
      </Badge>
    );
  }
  if (companyRole === "COMPANY_ADMIN" || companyRole === "COMPANY_DELEGATE") {
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="size-3.5" />
        {t("perm_admin")}
      </Badge>
    );
  }
  return <Badge variant="outline">{t("perm_staff")}</Badge>;
}

/** Cột "Vai trò nghiệp vụ": CĐT/TVGS/NT/PTN/Quản trị hệ thống (User.role). */
function BusinessRoleCell({ role }: { role: string }) {
  const t = useTranslations("users");
  if (!role) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="outline">{t(`role_${role}`)}</Badge>;
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
  return (
    <span className="text-muted-foreground">
      {formatDate(value)}
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
      accessorKey: "role",
      header: t("businessRoleColumn"),
      cell: ({ row }) => <BusinessRoleCell role={row.original.role} />,
    },
    {
      accessorKey: "isSuperAdmin",
      header: t("roleColumn"),
      cell: ({ row }) => (
        <PermBadge
          isSuperAdmin={row.original.isSuperAdmin}
          companyRole={row.original.companyRole}
        />
      ),
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
