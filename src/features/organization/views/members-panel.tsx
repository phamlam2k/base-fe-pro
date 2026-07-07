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
import { getMemberColumns } from "@/features/organization/components/member-columns";
import { MemberFormDialog } from "@/features/manage-company-member";
import { useQuery } from "@tanstack/react-query";
import { companyMemberQueries } from "@/entities/company-member";
import { useDeleteMember } from "@/features/manage-company-member";
import {
  ORG_ROLES,
  type Member,
  type MemberListParams,
  type OrgRole,
} from "@/features/organization/types";

type DialogState = { mode: "create" } | { mode: "edit"; member: Member } | null;

export function MembersPanel({ companyId }: { companyId: string }) {
  const t = useTranslations("organization");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<OrgRole | "all">("all");

  const debouncedSearch = useDebounce(search);
  const resetPage = () =>
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

  const params: MemberListParams = {
    companyId,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    role,
    sortBy: (sorting[0]?.id as MemberListParams["sortBy"]) ?? "createdAt",
    sortOrder: sorting[0]?.desc === false ? "asc" : "desc",
  };

  const membersQuery = useQuery(companyMemberQueries.list(params));
  const deleteMember = useDeleteMember();

  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [toDelete, setToDelete] = React.useState<Member | null>(null);

  const columns = React.useMemo(
    () =>
      getMemberColumns({
        t,
        onEdit: (member) => setDialog({ mode: "edit", member }),
        onDelete: setToDelete,
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
              resetPage();
            }}
            placeholder={t("members.searchPlaceholder")}
            className="w-64 pl-8"
          />
        </div>

        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as OrgRole | "all");
            resetPage();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("members.allRoles")}</SelectItem>
            {ORG_ROLES.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {t(`roles.${candidate}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PermissionGate permission="orgs:manage">
          <Button className="ml-auto" onClick={() => setDialog({ mode: "create" })}>
            <Plus />
            {t("members.add")}
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={membersQuery.data?.items ?? []}
        pageCount={membersQuery.data?.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={membersQuery.isPending || membersQuery.isPlaceholderData}
      />

      <MemberFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        companyId={companyId}
        member={dialog?.mode === "edit" ? dialog.member : null}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("members.deleteTitle", { name: toDelete?.name ?? "" })}
        description={t("members.deleteDescription")}
        isPending={deleteMember.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteMember.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          });
        }}
      />
    </div>
  );
}
