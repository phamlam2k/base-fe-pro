"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import type { TeamType } from "@/features/organization/types";

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
