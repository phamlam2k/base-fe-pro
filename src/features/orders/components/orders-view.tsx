"use client";

import * as React from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { ROUTES } from "@/config/routes";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlSyncedState } from "@/hooks/use-url-synced-state";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { useOrders } from "@/features/orders/hooks";
import {
  ORDER_STATUSES,
  type Order,
  type OrderListParams,
  type OrderStatus,
} from "@/features/orders/types";

function TotalCell({ value }: { value: number }) {
  const format = useFormatter();
  return (
    <span className="tabular-nums">
      {format.number(value, { style: "currency", currency: "USD" })}
    </span>
  );
}

function DateCell({ value }: { value: string }) {
  const format = useFormatter();
  return (
    <span className="text-muted-foreground">
      {format.dateTime(new Date(value), { dateStyle: "medium" })}
    </span>
  );
}

export function OrdersView() {
  const t = useTranslations("orders");

  const [filters, patchFilters] = useUrlSyncedState({
    q: "",
    status: "all",
    page: 1,
    pageSize: 10,
    sort: "createdAt",
    order: "desc",
  });

  const debouncedSearch = useDebounce(filters.q);

  const params: OrderListParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: debouncedSearch || undefined,
    status: filters.status as OrderStatus | "all",
    sortBy: filters.sort as OrderListParams["sortBy"],
    sortOrder: filters.order as "asc" | "desc",
  };

  const ordersQuery = useOrders(params);

  const columns = React.useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("code")} />
        ),
        cell: ({ row }) => (
          <Button variant="link" size="sm" className="px-0 font-mono" asChild>
            <Link href={ROUTES.orderDetail(row.original.id)}>
              {row.original.code}
            </Link>
          </Button>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("customer"),
        cell: ({ row }) => (
          <div className="grid">
            <span className="font-medium">{row.original.customerName}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.customerEmail}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("total")} />
        ),
        cell: ({ row }) => <TotalCell value={row.original.total} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("createdAt")} />
        ),
        cell: ({ row }) => <DateCell value={row.original.createdAt} />,
      },
    ],
    [t],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={filters.q}
            onChange={(event) =>
              patchFilters({ q: event.target.value, page: 1 })
            }
            placeholder={t("searchPlaceholder")}
            className="w-64 pl-8"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => patchFilters({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={ordersQuery.data?.items ?? []}
        pageCount={ordersQuery.data?.totalPages ?? 0}
        pagination={{ pageIndex: filters.page - 1, pageSize: filters.pageSize }}
        onPaginationChange={(updater) => {
          const next =
            typeof updater === "function"
              ? updater({
                  pageIndex: filters.page - 1,
                  pageSize: filters.pageSize,
                })
              : updater;
          patchFilters({ page: next.pageIndex + 1, pageSize: next.pageSize });
        }}
        sorting={[{ id: filters.sort, desc: filters.order === "desc" }]}
        onSortingChange={(updater) => {
          const current = [{ id: filters.sort, desc: filters.order === "desc" }];
          const next =
            typeof updater === "function" ? updater(current) : updater;
          patchFilters({
            sort: next[0]?.id ?? "createdAt",
            order: next[0]?.desc === false ? "asc" : "desc",
            page: 1,
          });
        }}
        isLoading={ordersQuery.isPending || ordersQuery.isPlaceholderData}
      />
    </div>
  );
}
