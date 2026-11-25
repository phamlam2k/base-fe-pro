"use client";

import { FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useSelectedProject } from "../model/use-selected-project";

/** Thanh chọn dự án (header) — lưu global state, mọi list lọc theo dự án này. */
export function ProjectSelector() {
  const t = useTranslations("project");
  const { projects, selectedProjectId, setSelectedProjectId, isEmpty, isLoading } =
    useSelectedProject();

  if (isLoading) return null;
  if (isEmpty) {
    return (
      <span className="text-muted-foreground hidden text-xs sm:inline">
        {t("noProject")}
      </span>
    );
  }

  return (
    <Select
      value={selectedProjectId ?? ""}
      onValueChange={(v) => setSelectedProjectId(v)}
    >
      <SelectTrigger className="h-8 w-[180px] gap-1.5 text-sm sm:w-[220px]">
        <FolderOpen className="text-muted-foreground size-4 shrink-0" />
        <SelectValue placeholder={t("selectProject")} />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
