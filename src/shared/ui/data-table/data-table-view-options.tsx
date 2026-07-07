"use client";

import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { VisibilityState } from "@tanstack/react-table";

/**
 * Column show/hide dropdown. Column ids are translated through the given
 * label map so features control their own copy.
 */
export function DataTableViewOptions({
  columnLabels,
  columnVisibility,
  onToggle,
}: {
  columnLabels: Record<string, string>;
  columnVisibility: VisibilityState;
  onToggle: (columnId: string, visible: boolean) => void;
}) {
  const t = useTranslations("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 />
          {t("view")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(columnLabels).map(([columnId, label]) => (
          <DropdownMenuCheckboxItem
            key={columnId}
            checked={columnVisibility[columnId] !== false}
            onCheckedChange={(checked) => onToggle(columnId, !!checked)}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
