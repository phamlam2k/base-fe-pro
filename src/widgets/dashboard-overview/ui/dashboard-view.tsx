"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardOptions } from "@/widgets/dashboard-overview/api/dashboard.api";
import {
  RevenueChart,
  RolesChart,
  SignupsChart,
} from "./charts";
import { RecentUsers } from "./recent-users";
import { StatsCards } from "./stats-cards";

export function DashboardView() {
  const { data, isPending } = useQuery(dashboardOptions());

  return (
    <div className="grid gap-4">
      <StatsCards stats={data?.stats} isLoading={isPending} />

      <RevenueChart data={data?.revenueByMonth} isLoading={isPending} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RolesChart data={data?.usersByRole} isLoading={isPending} />
        </div>
        <div className="lg:col-span-2">
          <SignupsChart data={data?.signupsByMonth} isLoading={isPending} />
        </div>
      </div>

      <RecentUsers users={data?.recentUsers} isLoading={isPending} />
    </div>
  );
}
