"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CompanyStatusBadge, companyQueries } from "@/entities/company";
import type { Company } from "@/entities/company";

/**
 * Bộ chọn công ty dùng chung cho các console phạm-vi-theo-công-ty (Phân quyền
 * và Quản lý dự án). Trả về công ty đang chọn (mặc định công ty đầu tiên).
 */
export function useCompanyPicker() {
  const companiesQuery = useQuery(
    companyQueries.list({ page: 1, pageSize: 100 }),
  );
  const companies = companiesQuery.data?.items ?? [];

  // Suy công ty đang xem ngay trong render (không effect): ưu tiên lựa chọn của
  // người dùng, nếu chưa chọn thì lấy công ty đầu tiên khi đã tải xong.
  const [picked, setPicked] = React.useState<string | null>(null);
  const companyId = picked ?? companies[0]?.id ?? "";
  const selected = companies.find((c) => c.id === companyId) ?? null;

  return {
    companies,
    companyId,
    selected,
    onChange: setPicked,
    isLoading: companiesQuery.isPending,
  };
}

export function CompanyContext({
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
          {companies.length > 1 ? (
            // Nhiều công ty (SuperAdmin) → cho chọn. 1 công ty (Company Admin) →
            // chỉ hiện tên, KHÔNG dropdown vì họ chỉ quản trị 1 công ty.
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
          ) : (
            <span className="text-base font-semibold">
              {selected?.name ?? companies[0]?.name ?? ""}
            </span>
          )}
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
