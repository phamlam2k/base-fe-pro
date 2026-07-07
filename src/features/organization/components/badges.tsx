"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type {
  CompanyStatus,
  OrgRole,
  TeamType,
} from "@/features/organization/types";

const ROLE_VARIANT: Record<OrgRole, "default" | "secondary" | "outline"> = {
  COMPANY_ADMIN: "default",
  COMPANY_DELEGATE: "secondary",
  COMPANY_MEMBER: "outline",
};

export function RoleBadge({ role }: { role: OrgRole }) {
  const t = useTranslations("organization");
  return <Badge variant={ROLE_VARIANT[role]}>{t(`roles.${role}`)}</Badge>;
}

const STATUS_DOT: Record<CompanyStatus, string> = {
  ACTIVE: "bg-emerald-500",
  SUSPENDED: "bg-red-500",
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  const t = useTranslations("organization");
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {t(`statuses.${status}`)}
    </Badge>
  );
}

const TEAM_TYPE_STYLE: Record<TeamType, string> = {
  SUPERVISION: "border-blue-300 text-blue-700 dark:text-blue-300",
  CONTRACTOR: "border-orange-300 text-orange-700 dark:text-orange-300",
  TESTING: "border-violet-300 text-violet-700 dark:text-violet-300",
};

export function TeamTypeBadge({ type }: { type: TeamType }) {
  const t = useTranslations("organization");
  return (
    <Badge variant="outline" className={TEAM_TYPE_STYLE[type]}>
      {t(`teamTypes.${type}`)}
    </Badge>
  );
}
