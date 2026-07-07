"use client";

import * as React from "react";
import { Ban, CheckCircle2, MoreHorizontal, Plus, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { DataTable } from "@/shared/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header";
import { PermissionGate } from "@/shared/ui/permission-gate";
import { usePermission } from "@/providers/session-provider";
import { useDebounce } from "@/shared/lib/use-debounce";
import { StatusBadge } from "@/features/organization/components/badges";
import { CompanyFormDialog } from "@/features/organization/dialogs/company-form-dialog";
import { useCompanies, useUpdateCompany } from "@/features/organization/hooks";
import type { Company, CompanyListParams } from "@/features/organization/types";

export function CompaniesPanel() {
  const t = useTranslations("organization");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search);
  const updateCompany = useUpdateCompany();

  const params: CompanyListParams = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: (sorting[0]?.id as CompanyListParams["sortBy"]) ?? "createdAt",
    sortOrder: sorting[0]?.desc === false ? "asc" : "desc",
  };

  const companiesQuery = useCompanies(params);

  const columns = React.useMemo<ColumnDef<Company>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("companies.colName")} />
        ),
        cell: ({ row }) => (
          <span className="text-base font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("companies.colStatus"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "memberCount",
        header: t("companies.colMembers"),
        cell: ({ row }) => <span className="tabular-nums">{row.original.memberCount}</span>,
      },
      {
        accessorKey: "projectCount",
        header: t("companies.colProjects"),
        cell: ({ row }) => <span className="tabular-nums">{row.original.projectCount}</span>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("companies.colCreated")} />
        ),
        cell: ({ row }) => <CreatedCell value={row.original.createdAt} />,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="text-right">
            <PermissionGate permission="orgs:manage">
              <CompanyActions
                company={row.original}
                onToggle={(company) =>
                  updateCompany.mutate({
                    id: company.id,
                    input: {
                      status: company.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                    },
                  })
                }
              />
            </PermissionGate>
          </div>
        ),
      },
    ],
    [t, updateCompany],
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
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder={t("companies.searchPlaceholder")}
            className="w-64 pl-8"
          />
        </div>
        <PermissionGate permission="orgs:manage">
          <Button className="ml-auto" onClick={() => setDialogOpen(true)}>
            <Plus />
            {t("companies.add")}
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={companiesQuery.data?.items ?? []}
        pageCount={companiesQuery.data?.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={companiesQuery.isPending || companiesQuery.isPlaceholderData}
      />

      <CompanyFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function CompanyActions({
  company,
  onToggle,
}: {
  company: Company;
  onToggle: (company: Company) => void;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const { can } = usePermission();
  if (!can("orgs:manage")) return null;

  const isActive = company.status === "ACTIVE";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={tCommon("openMenu")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          variant={isActive ? "destructive" : "default"}
          onClick={() => onToggle(company)}
        >
          {isActive ? <Ban /> : <CheckCircle2 />}
          {isActive ? t("companies.suspend") : t("companies.activate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreatedCell({ value }: { value: string }) {
  const format = useFormatter();
  return (
    <span className="text-muted-foreground">
      {format.dateTime(new Date(value), { dateStyle: "medium" })}
    </span>
  );
}
