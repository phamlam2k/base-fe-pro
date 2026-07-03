"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Product, ProductStatus } from "@/features/products/types";

const STATUS_STYLES: Record<ProductStatus, string> = {
  active: "bg-emerald-500",
  draft: "bg-amber-500",
  archived: "bg-zinc-400",
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const t = useTranslations("products");
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status])} />
      {t(`statuses.${status}`)}
    </Badge>
  );
}

function PriceCell({ value }: { value: number }) {
  const format = useFormatter();
  return (
    <span className="tabular-nums">
      {format.number(value, { style: "currency", currency: "USD" })}
    </span>
  );
}

function RowActions({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const t = useTranslations("common");
  const tProducts = useTranslations("products");
  const { canAny } = usePermission();

  if (!canAny(["products:update", "products:delete"])) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("openMenu")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permission="products:update">
          <DropdownMenuItem onClick={() => onEdit(product)}>
            <Pencil />
            {tProducts("editProduct")}
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permission="products:delete">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(product)}
          >
            <Trash2 />
            {tProducts("deleteProduct")}
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getProductColumns({
  t,
  selectable,
  onEdit,
  onDelete,
}: {
  t: (key: string) => string;
  selectable: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}): ColumnDef<Product>[] {
  const columns: ColumnDef<Product>[] = [];

  if (selectable) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(!!checked)
          }
          aria-label={t("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          aria-label={t("selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  columns.push(
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("name")} />
      ),
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.sku}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("category"),
      cell: ({ row }) => (
        <CategoryCell category={row.original.category} />
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("price")} />
      ),
      cell: ({ row }) => <PriceCell value={row.original.price} />,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("stock")} />
      ),
      cell: ({ row }) => (
        <span
          className={cn(
            "tabular-nums",
            row.original.stock === 0 && "text-destructive font-medium",
          )}
        >
          {row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <RowActions
            product={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  );

  return columns;
}

function CategoryCell({ category }: { category: Product["category"] }) {
  const t = useTranslations("products");
  return <span>{t(`categories.${category}`)}</span>;
}
