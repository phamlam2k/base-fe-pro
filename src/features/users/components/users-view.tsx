"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PaginationState, SortingState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { ROLES, type Role } from "@/config/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import { getUserColumns } from "@/features/users/components/user-columns";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { useDeleteUser, useUsers } from "@/features/users/hooks";
import {
  USER_STATUSES,
  type User,
  type UserListParams,
  type UserStatus,
} from "@/features/users/types";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; user: User }
  | null;

/**
 * Container component owning all list state (filters, pagination, sorting)
 * and orchestrating the dialogs. The page file just renders this.
 */
export function UsersView() {
  const t = useTranslations("users");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<Role | "all">("all");
  const [status, setStatus] = React.useState<UserStatus | "all">("all");

  const debouncedSearch = useDebounce(search);

  const resetToFirstPage = () =>
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

  const params: UserListParams = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    role,
    status,
    sortBy: (sorting[0]?.id as UserListParams["sortBy"]) ?? "createdAt",
    sortOrder: sorting[0]?.desc === false ? "asc" : "desc",
  };

  const usersQuery = useUsers(params);
  const deleteUser = useDeleteUser();

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const columns = React.useMemo(
    () =>
      getUserColumns({
        t,
        onEdit: (user) => setDialog({ mode: "edit", user }),
        onDelete: setUserToDelete,
      }),
    [t],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
            placeholder={t("searchPlaceholder")}
            className="w-64 pl-8"
          />
        </div>

        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as Role | "all");
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            {ROLES.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {t(`roles.${candidate}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as UserStatus | "all");
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {USER_STATUSES.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {t(`statuses.${candidate}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PermissionGate permission="users:create">
          <Button
            className="ml-auto"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus />
            {t("addUser")}
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={usersQuery.data?.items ?? []}
        pageCount={usersQuery.data?.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={usersQuery.isPending || usersQuery.isPlaceholderData}
      />

      <UserFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        user={dialog?.mode === "edit" ? dialog.user : null}
      />

      <ConfirmDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title={t("deleteConfirmTitle", { name: userToDelete?.name ?? "" })}
        description={t("deleteConfirmDescription")}
        isPending={deleteUser.isPending}
        onConfirm={() => {
          if (!userToDelete) return;
          deleteUser.mutate(userToDelete.id, {
            onSuccess: () => setUserToDelete(null),
          });
        }}
      />
    </div>
  );
}
