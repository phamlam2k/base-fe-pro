"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import type { OrgRole } from "@/entities/company-member/model/company-member";

const ROLE_VARIANT: Record<OrgRole, "default" | "secondary" | "outline"> = {
  COMPANY_ADMIN: "default",
  COMPANY_DELEGATE: "secondary",
  COMPANY_MEMBER: "outline",
};

/** Visual representation of a company member's role (FSD `ui` segment). */
export function MemberRoleBadge({ role }: { role: OrgRole }) {
  const t = useTranslations("organization");
  return <Badge variant={ROLE_VARIANT[role]}>{t(`roles.${role}`)}</Badge>;
}
