"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Plus,
  Wrench,
  XCircle,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { ROUTES } from "@/shared/config/routes";
import { useSession } from "@/entities/session";
import { acceptanceRequestApi } from "@/entities/acceptance-request";
import type { AcceptanceSummary } from "@/entities/acceptance-request";
import { useSelectedProjectStore, useSelectedProject } from "@/features/select-project";

/** Vai trò nghiệp vụ Madoka dùng để chọn nội dung dashboard. */
type MadokaRole =
  | "admin"
  | "investor"
  | "supervisor"
  | "contractor"
  | "lab"
  | "none";

/** Các trạng thái phiếu + màu (dùng cho KPI + donut phân bố). */
const STATUS_META = [
  { key: "pending", color: "#f59e0b" },
  { key: "supplement", color: "#fb923c" },
  { key: "confirmed", color: "#3b82f6" },
  { key: "approved", color: "#22c55e" },
  { key: "remediate", color: "#eab308" },
  { key: "rejected", color: "#ef4444" },
  { key: "vetoed", color: "#64748b" },
] as const;

type StatusKey = (typeof STATUS_META)[number]["key"];

type TodoItem = { key: string; count: number; href: string; tone: string };

const EMPTY_SUMMARY: AcceptanceSummary = {
  pending: 0,
  supplement: 0,
  confirmed: 0,
  approved: 0,
  remediate: 0,
  rejected: 0,
  vetoed: 0,
  total: 0,
};

/** "Việc cần xử lý" theo vai trò — count lấy từ summary, link tới màn tương ứng. */
function todosFor(role: MadokaRole, s: AcceptanceSummary): TodoItem[] {
  const reqs = ROUTES.acceptanceRequests;
  const recs = ROUTES.acceptanceRecords;
  switch (role) {
    case "contractor":
      return [
        { key: "contractorSupplement", count: s.supplement, href: reqs, tone: "amber" },
        { key: "contractorRemediate", count: s.remediate, href: reqs, tone: "yellow" },
      ];
    case "supervisor":
      return [
        { key: "supervisorPending", count: s.pending, href: reqs, tone: "amber" },
        { key: "supervisorConfirmed", count: s.confirmed, href: reqs, tone: "blue" },
      ];
    case "lab":
      return [
        { key: "labPending", count: s.pending + s.confirmed, href: reqs, tone: "blue" },
      ];
    case "investor":
      return [
        { key: "investorRecords", count: s.approved, href: recs, tone: "green" },
      ];
    case "admin":
      return [
        { key: "adminPending", count: s.pending, href: reqs, tone: "amber" },
        { key: "adminApproved", count: s.approved, href: recs, tone: "green" },
      ];
    default:
      return [];
  }
}

const TONE_CLASS: Record<string, string> = {
  amber: "text-amber-600",
  yellow: "text-yellow-600",
  blue: "text-blue-600",
  green: "text-green-600",
  red: "text-destructive",
};

export function DashboardView() {
  const t = useTranslations("dashboard");
  const { user } = useSession();

  const role: MadokaRole = (user.madokaRole ||
    (user.role === "admin" ? "admin" : "none")) as MadokaRole;

  const projectId = useSelectedProjectStore((st) => st.selectedProjectId);
  const { isEmpty: isEmptyProject } = useSelectedProject();
  const tProject = useTranslations("project");
  const summaryQuery = useQuery({
    queryKey: ["acceptance-requests", "summary", projectId],
    queryFn: () => acceptanceRequestApi.summary(projectId ?? undefined),
  });
  const recentQuery = useQuery({
    queryKey: ["acceptance-requests", "recent", projectId],
    queryFn: () => acceptanceRequestApi.list(undefined, 1, projectId ?? undefined),
  });

  const s = summaryQuery.data ?? EMPTY_SUMMARY;
  const recent = (recentQuery.data?.items ?? []).slice(0, 6);
  const todos = todosFor(role, s).filter((it) => it.count > 0);
  // CHỈ Nhà thầu mới tạo phiếu (không cả madokaRole admin).
  const canCreate = role === "contractor";

  const pieData = STATUS_META.map((m) => ({
    name: t(`kpi.${m.key}`),
    value: s[m.key as StatusKey],
    fill: m.color,
  })).filter((d) => d.value > 0);

  const KPIS: { key: StatusKey | "total"; icon: React.ElementType }[] = [
    { key: "total", icon: ClipboardList },
    { key: "pending", icon: Clock },
    { key: "confirmed", icon: CheckCircle2 },
    { key: "approved", icon: CheckCircle2 },
    { key: "remediate", icon: Wrench },
    { key: "rejected", icon: XCircle },
  ];

  return (
    <div className="grid gap-6">
      {isEmptyProject ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {tProject("noProjectNotice")}
        </div>
      ) : null}
      {/* Greeting + vai trò + CTA tạo phiếu */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">
            {t("greeting", { name: user.name })}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("roleTagline", { role: t(`roleLabel.${role}`) })}
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="ml-auto">
            <Link href={ROUTES.acceptanceRequestNew}>
              <Plus className="mr-1.5 size-4" />
              {t("newRequest")}
            </Link>
          </Button>
        ) : null}
      </div>

      {role === "none" ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            {t("noRole")}
          </CardContent>
        </Card>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {KPIS.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="grid gap-1 pt-6">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Icon className="size-3.5" />
                {t(`kpi.${key}`)}
              </div>
              {summaryQuery.isPending ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <span className="text-2xl font-semibold tabular-nums">
                  {key === "total" ? s.total : s[key as StatusKey]}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Việc cần xử lý */}
      {role !== "none" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("todo.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {todos.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("todo.empty")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {todos.map((it) => (
                  <Link
                    key={it.key}
                    href={it.href}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                  >
                    <div className="grid gap-0.5">
                      <span
                        className={`text-2xl font-semibold tabular-nums ${TONE_CLASS[it.tone] ?? ""}`}
                      >
                        {it.count}
                      </span>
                      <span className="text-sm">{t(`todo.${it.key}`)}</span>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut phân bố trạng thái */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("distribution.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t("distribution.empty")}
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <ul className="grid flex-1 gap-1.5 text-sm">
                  {pieData.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: d.fill }}
                      />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phiếu gần đây */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t("recent.title")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.acceptanceRequests}>
                {t("recent.viewAll")}
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {recentQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : recent.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t("recent.empty")}
              </p>
            ) : (
              recent.map((r) => (
                <Link
                  key={r.id}
                  href={ROUTES.acceptanceRequestDetail(r.id)}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="font-medium">{r.code}</span>
                  <span className="text-muted-foreground truncate">
                    {r.typeDisplay}
                    {r.contractorTeamName ? ` · ${r.contractorTeamName}` : ""}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-amber-600">
                    {r.statusDisplay}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
