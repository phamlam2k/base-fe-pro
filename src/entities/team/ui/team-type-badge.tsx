"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import type { TeamType } from "@/entities/team/model/team";

const TEAM_TYPE_STYLE: Record<TeamType, string> = {
  SUPERVISION: "border-blue-300 text-blue-700 dark:text-blue-300",
  CONTRACTOR: "border-orange-300 text-orange-700 dark:text-orange-300",
  TESTING: "border-violet-300 text-violet-700 dark:text-violet-300",
};

/** Visual representation of a team's type (FSD `ui` segment). */
export function TeamTypeBadge({ type }: { type: TeamType }) {
  const t = useTranslations("organization");
  return (
    <Badge variant="outline" className={TEAM_TYPE_STYLE[type]}>
      {t(`teamTypes.${type}`)}
    </Badge>
  );
}
