"use client";

import * as React from "react";
import {
  Building2,
  FolderTree,
  Info,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { CompanyStatusBadge } from "@/entities/company";
import { CompaniesPanel } from "./companies-panel";
import { MembersPanel } from "./members-panel";
import { RoleLegend } from "./role-legend";
import { StructurePanel } from "./structure-panel";
import { useQuery } from "@tanstack/react-query";
import { companyQueries } from "@/entities/company";
import type { Company } from "@/entities/company";

/**
 * Access-management console. A company picker scopes the "Members" and
 * "Structure" tabs; the "Companies" tab manages the companies themselves
 * (platform / SuperAdmin), and "Guide" explains every role in plain language.
 */
export function OrganizationView() {
  const t = useTranslations("organization");

  // Load all companies once to drive the picker (small dataset).
  const companiesQuery = useQuery(companyQueries.list({ page: 1, pageSize: 100 }));
  const companies = companiesQuery.data?.items ?? [];

  // Derive the active company during render (no effect): the user's explicit
  // pick if any, otherwise fall back to the first company once loaded.
  const [picked, setPicked] = React.useState<string | null>(null);
  const companyId = picked ?? companies[0]?.id ?? "";
  const selected = companies.find((c) => c.id === companyId) ?? null;

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="members" className="gap-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="members" className="gap-1.5 text-sm">
            <Users className="size-4" />
            {t("tabs.members")}
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5 text-sm">
            <FolderTree className="size-4" />
            {t("tabs.structure")}
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5 text-sm">
            <Building2 className="size-4" />
            {t("tabs.companies")}
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1.5 text-sm">
            <Info className="size-4" />
            {t("tabs.guide")}
          </TabsTrigger>
        </TabsList>

        {/* Members + Structure share the company picker + summary. */}
        <TabsContent value="members" className="grid gap-4">
          <CompanyContext
            companies={companies}
            companyId={companyId}
            onChange={setPicked}
            selected={selected}
            isLoading={companiesQuery.isPending}
          />
          {companyId ? <MembersPanel companyId={companyId} /> : null}
        </TabsContent>

        <TabsContent value="structure" className="grid gap-4">
          <CompanyContext
            companies={companies}
            companyId={companyId}
            onChange={setPicked}
            selected={selected}
            isLoading={companiesQuery.isPending}
          />
          {companyId ? <StructurePanel companyId={companyId} /> : null}
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesPanel />
        </TabsContent>

        <TabsContent value="guide">
          <RoleLegend />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyContext({
  companies,
  companyId,
  onChange,
  selected,
  isLoading,
}: {
  companies: Company[];
  companyId: string;
  onChange: (id: string) => void;
  selected: Company | null;
  isLoading: boolean;
}) {
  const t = useTranslations("organization");

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!companies.length) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        {t("companies.empty")}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs font-medium uppercase">
            {t("contextCompany")}
          </label>
          <Select value={companyId} onValueChange={onChange}>
            <SelectTrigger className="min-w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat label={t("summary.status")}>
              <CompanyStatusBadge status={selected.status} />
            </Stat>
            <Stat label={t("summary.members")}>
              <span className="text-lg font-semibold tabular-nums">
                {selected.memberCount}
              </span>
            </Stat>
            <Stat label={t("summary.projects")}>
              <span className="text-lg font-semibold tabular-nums">
                {selected.projectCount}
              </span>
            </Stat>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </span>
      <div className="flex h-9 items-center">{children}</div>
    </div>
  );
}
