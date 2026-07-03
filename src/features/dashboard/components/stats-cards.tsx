"use client";

import { Activity, DollarSign, TrendingUp, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/features/dashboard/api";

export function StatsCards({
  stats,
  isLoading,
}: {
  stats?: DashboardData["stats"];
  isLoading: boolean;
}) {
  const t = useTranslations("dashboard");
  const format = useFormatter();

  const cards = [
    {
      key: "totalUsers",
      icon: Users,
      value: stats ? format.number(stats.totalUsers) : null,
    },
    {
      key: "activeUsers",
      icon: Activity,
      value: stats ? format.number(stats.activeUsers) : null,
    },
    {
      key: "revenue",
      icon: DollarSign,
      value: stats
        ? format.number(stats.revenue, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          })
        : null,
    },
    {
      key: "growth",
      icon: TrendingUp,
      value: stats ? `${stats.growthRate > 0 ? "+" : ""}${stats.growthRate}%` : null,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <card.icon className="size-4" />
              {t(card.key)}
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading || card.value === null ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                card.value
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
