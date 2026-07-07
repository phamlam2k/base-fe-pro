"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PaginationState, SortingState } from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table/data-table";
import { PermissionGate } from "@/entities/session";
import { useDebounce } from "@/shared/lib/use-debounce";
import { getUserColumns } from "@/features/users/components/user-columns";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { useDeleteUser, useUsers } from "@/features/users/hooks";
import {
  SUPER_ADMIN_FILTERS,
  type SuperAdminFilter,
  type User,
  type UserListParams,
} from "@/features/users/types";

type DialogState = { mode: "create" } | { mode: "edit"; user: User } | null;

/** Platform user management (SuperAdmin). Backed by the Django user API. */
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
  const [superAdmin, setSuperAdmin] = React.useState<SuperAdminFilter>("all");

  const debouncedSearch = useDebounce(search);
  const resetToFirstPage = () =>
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

  const params: UserListParams = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    superAdmin,
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
          value={superAdmin}
          onValueChange={(value) => {
            setSuperAdmin(value as SuperAdminFilter);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPER_ADMIN_FILTERS.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {t(`filter.${candidate}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PermissionGate permission="users:create">
          <Button className="ml-auto" onClick={() => setDialog({ mode: "create" })}>
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
        title={t("deleteConfirmTitle", { name: userToDelete?.name || userToDelete?.email || "" })}
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
