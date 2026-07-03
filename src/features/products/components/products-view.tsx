"use client";

import * as React from "react";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowSelectionState, VisibilityState } from "@tanstack/react-table";

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
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { FeatureGate } from "@/components/shared/feature-gate";
import { PermissionGate } from "@/components/shared/permission-gate";
import { usePermission } from "@/providers/session-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlSyncedState } from "@/hooks/use-url-synced-state";
import { downloadCsv, toCsv } from "@/lib/csv";
import { getProductColumns } from "@/features/products/components/product-columns";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import {
  useBulkDeleteProducts,
  useDeleteProduct,
  useProducts,
} from "@/features/products/hooks";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  type Product,
  type ProductCategory,
  type ProductListParams,
  type ProductStatus,
} from "@/features/products/types";

type DialogState = { mode: "create" } | { mode: "edit"; product: Product } | null;

/**
 * Products list container. Filters/pagination/sort live in the URL
 * (shareable, refresh-safe); selection and dialogs are local state.
 */
export function ProductsView() {
  const t = useTranslations("products");
  const { can } = usePermission();

  const [filters, patchFilters] = useUrlSyncedState({
    q: "",
    category: "all",
    status: "all",
    page: 1,
    pageSize: 10,
    sort: "createdAt",
    order: "desc",
  });

  const debouncedSearch = useDebounce(filters.q);

  const params: ProductListParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: debouncedSearch || undefined,
    category: filters.category as ProductCategory | "all",
    status: filters.status as ProductStatus | "all",
    sortBy: filters.sort as ProductListParams["sortBy"],
    sortOrder: filters.order as "asc" | "desc",
  };

  const productsQuery = useProducts(params);
  const deleteProduct = useDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = React.useState(false);

  const selectedIds = Object.keys(rowSelection);
  const canDelete = can("products:delete");

  const columns = React.useMemo(
    () =>
      getProductColumns({
        t,
        selectable: canDelete,
        onEdit: (product) => setDialog({ mode: "edit", product }),
        onDelete: setProductToDelete,
      }),
    [t, canDelete],
  );

  function exportCsv() {
    const rows = productsQuery.data?.items ?? [];
    const selected = new Set(selectedIds);
    const exportRows = selected.size
      ? rows.filter((row) => selected.has(row.id))
      : rows;
    downloadCsv(
      "products.csv",
      toCsv(exportRows, [
        { key: "id", header: "ID" },
        { key: "name", header: t("name") },
        { key: "sku", header: "SKU" },
        { key: "category", header: t("category") },
        { key: "price", header: t("price") },
        { key: "stock", header: t("stock") },
        { key: "status", header: t("status") },
      ]),
    );
  }

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
          value={filters.category}
          onValueChange={(value) => patchFilters({ category: value, page: 1 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`categories.${category}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => patchFilters({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {PRODUCT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkConfirmOpen(true)}
            >
              <Trash2 />
              {t("deleteSelected", { count: selectedIds.length })}
            </Button>
          ) : null}

          <FeatureGate flag="csvExport">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download />
              {t("exportCsv")}
            </Button>
          </FeatureGate>

          <DataTableViewOptions
            columnLabels={{
              category: t("category"),
              price: t("price"),
              stock: t("stock"),
              status: t("status"),
            }}
            columnVisibility={columnVisibility}
            onToggle={(columnId, visible) =>
              setColumnVisibility((previous) => ({
                ...previous,
                [columnId]: visible,
              }))
            }
          />

          <PermissionGate permission="products:create">
            <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
              <Plus />
              {t("addProduct")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={productsQuery.data?.items ?? []}
        pageCount={productsQuery.data?.totalPages ?? 0}
        pagination={{
          pageIndex: filters.page - 1,
          pageSize: filters.pageSize,
        }}
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
        isLoading={productsQuery.isPending || productsQuery.isPlaceholderData}
        getRowId={(row) => row.id}
        rowSelection={canDelete ? rowSelection : undefined}
        onRowSelectionChange={canDelete ? setRowSelection : undefined}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      <ProductFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        product={dialog?.mode === "edit" ? dialog.product : null}
      />

      <ConfirmDialog
        open={productToDelete !== null}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title={t("deleteConfirmTitle", { name: productToDelete?.name ?? "" })}
        description={t("deleteConfirmDescription")}
        isPending={deleteProduct.isPending}
        onConfirm={() => {
          if (!productToDelete) return;
          // Optimistic: dialog closes immediately, rollback happens on error.
          deleteProduct.mutate(productToDelete.id);
          setProductToDelete(null);
        }}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title={t("bulkDeleteConfirmTitle", { count: selectedIds.length })}
        description={t("deleteConfirmDescription")}
        isPending={bulkDelete.isPending}
        onConfirm={() =>
          bulkDelete.mutate(selectedIds, {
            onSuccess: () => {
              setRowSelection({});
              setBulkConfirmOpen(false);
            },
          })
        }
      />
    </div>
  );
}
