"use client";

import {
  Building2,
  FlaskConical,
  HardHat,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

/**
 * A plain-language guide to every role and the three isolation laws.
 * Deliberately large type + generous spacing so non-technical managers can
 * read it comfortably.
 */

interface RoleRow {
  key: string;
  icon: LucideIcon;
  tone: string;
}

const ROLE_ROWS: RoleRow[] = [
  { key: "SUPER_ADMIN", icon: ShieldCheck, tone: "text-rose-600" },
  { key: "COMPANY_ADMIN", icon: Building2, tone: "text-red-600" },
  { key: "COMPANY_DELEGATE", icon: UserCog, tone: "text-amber-600" },
  { key: "COMPANY_MEMBER", icon: UserRound, tone: "text-slate-600" },
  { key: "PROJECT_MEMBER", icon: Users, tone: "text-sky-600" },
  { key: "TEAM_SUPERVISION", icon: ShieldCheck, tone: "text-blue-600" },
  { key: "TEAM_CONTRACTOR", icon: HardHat, tone: "text-orange-600" },
  { key: "TEAM_TESTING", icon: FlaskConical, tone: "text-violet-600" },
];

const LAW_KEYS = ["lawA", "lawB", "lawC"] as const;

export function RoleLegend() {
  const t = useTranslations("organization");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("guide.rolesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {ROLE_ROWS.map(({ key, icon: Icon, tone }) => (
            <div key={key} className="flex gap-3">
              <Icon className={`mt-0.5 size-6 shrink-0 ${tone}`} />
              <div className="grid gap-0.5">
                <p className="text-base font-semibold">{t(`guide.role.${key}.name`)}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`guide.role.${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("guide.lawsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("guide.intro")}
          </p>
          {LAW_KEYS.map((law) => (
            <div key={law} className="border-l-2 border-primary/40 pl-4">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary">{t(`guide.${law}.tag`)}</Badge>
                <span className="text-base font-semibold">{t(`guide.${law}.name`)}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(`guide.${law}.desc`)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
