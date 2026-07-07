"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { CompanyStatus } from "@/entities/company/model/company";

const STATUS_DOT: Record<CompanyStatus, string> = {
  ACTIVE: "bg-emerald-500",
  SUSPENDED: "bg-red-500",
};

/** Visual representation of a company's status (FSD `ui` segment). */
export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const t = useTranslations("organization");
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {t(`statuses.${status}`)}
    </Badge>
  );
}
