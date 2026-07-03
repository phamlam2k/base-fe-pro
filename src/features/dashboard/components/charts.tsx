"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { useFormatter, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/features/dashboard/api";

/** Format a "YYYY-MM" key as a localized short month label. */
function useMonthLabel() {
  const format = useFormatter();
  return React.useCallback(
    (month: string) => format.dateTime(new Date(`${month}-15`), { month: "short" }),
    [format],
  );
}

function ChartCard({
  title,
  description,
  isLoading,
  children,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="aspect-video w-full" /> : children}
      </CardContent>
    </Card>
  );
}

export function RevenueChart({
  data,
  isLoading,
}: {
  data?: DashboardData["revenueByMonth"];
  isLoading: boolean;
}) {
  const t = useTranslations("dashboard");
  const monthLabel = useMonthLabel();

  const config = {
    revenue: { label: t("series.revenue"), color: "var(--chart-1)" },
    expenses: { label: t("series.expenses"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartCard
      title={t("revenueChartTitle")}
      description={t("revenueChartDescription")}
      isLoading={isLoading}
    >
      <ChartContainer config={config} className="h-72 w-full">
        <AreaChart data={data ?? []} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={monthLabel}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => monthLabel(String(label))}
              />
            }
          />
          <Area
            dataKey="expenses"
            type="natural"
            fill="var(--color-expenses)"
            fillOpacity={0.2}
            stroke="var(--color-expenses)"
            stackId="a"
          />
          <Area
            dataKey="revenue"
            type="natural"
            fill="var(--color-revenue)"
            fillOpacity={0.35}
            stroke="var(--color-revenue)"
            stackId="a"
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function SignupsChart({
  data,
  isLoading,
}: {
  data?: DashboardData["signupsByMonth"];
  isLoading: boolean;
}) {
  const t = useTranslations("dashboard");
  const monthLabel = useMonthLabel();

  const config = {
    signups: { label: t("series.signups"), color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartCard
      title={t("signupsChartTitle")}
      description={t("signupsChartDescription")}
      isLoading={isLoading}
    >
      <ChartContainer config={config} className="h-72 w-full">
        <BarChart data={data ?? []}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={monthLabel}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => monthLabel(String(label))}
              />
            }
          />
          <Bar dataKey="signups" fill="var(--color-signups)" radius={6} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

const ROLE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export function RolesChart({
  data,
  isLoading,
}: {
  data?: DashboardData["usersByRole"];
  isLoading: boolean;
}) {
  const t = useTranslations("dashboard");
  const tUsers = useTranslations("users");

  const config = {
    count: { label: t("rolesChartTitle") },
    admin: { label: tUsers("roles.admin"), color: "var(--chart-1)" },
    manager: { label: tUsers("roles.manager"), color: "var(--chart-2)" },
    viewer: { label: tUsers("roles.viewer"), color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const chartData = (data ?? []).map((entry) => ({
    ...entry,
    label: tUsers(`roles.${entry.role}`),
  }));

  return (
    <ChartCard
      title={t("rolesChartTitle")}
      description={t("rolesChartDescription")}
      isLoading={isLoading}
    >
      <ChartContainer config={config} className="mx-auto h-72 w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="role" hideLabel />} />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="role"
            innerRadius={55}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.role}
                fill={ROLE_COLORS[index % ROLE_COLORS.length]}
              />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="role" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
