import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/axios";
import type { Role } from "@/config/permissions";
import type { User } from "@/features/users";
import type { ApiResponse } from "@/types/api";

export interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    growthRate: number;
  };
  revenueByMonth: Array<{ month: string; revenue: number; expenses: number }>;
  signupsByMonth: Array<{ month: string; signups: number }>;
  usersByRole: Array<{ role: Role; count: number }>;
  recentUsers: User[];
}

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const response =
      await apiClient.get<ApiResponse<DashboardData>>("/dashboard");
    return response.data.data;
  },
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export function dashboardOptions() {
  return queryOptions({
    queryKey: dashboardKeys.all,
    queryFn: dashboardApi.get,
    staleTime: 60_000,
  });
}
