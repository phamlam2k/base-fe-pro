import type { NextRequest } from "next/server";

import { jsonData, requireAuth } from "@/shared/api/server";
import { ROLES } from "@/shared/config/permissions";
import { getDb, simulateLatency } from "@/mocks/db";

/**
 * Aggregated dashboard payload. Numbers derive from the mock users DB where
 * possible (role distribution, monthly signups) plus deterministic revenue
 * figures, so charts always have sensible shapes.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "dashboard:view");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const users = getDb().users;

  // Last 12 months as "YYYY-MM" keys, oldest first.
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const signupsByMonth = months.map((month) => ({
    month,
    signups: users.filter((user) => user.createdAt.startsWith(month)).length,
  }));

  const revenueByMonth = months.map((month, i) => {
    // Deterministic pseudo-random but pleasant curve.
    const base = 42_000 + i * 2_800;
    const wave = Math.round(Math.sin(i / 1.9) * 6_500);
    return {
      month,
      revenue: base + wave,
      expenses: Math.round((base + wave) * (0.52 + (i % 4) * 0.04)),
    };
  });

  const usersByRole = ROLES.map((role) => ({
    role,
    count: users.filter((user) => user.role === role).length,
  }));

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const currentRevenue = revenueByMonth[revenueByMonth.length - 1].revenue;
  const previousRevenue = revenueByMonth[revenueByMonth.length - 2].revenue;

  return jsonData({
    stats: {
      totalUsers,
      activeUsers,
      revenue: currentRevenue,
      growthRate:
        Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 1000) / 10,
    },
    revenueByMonth,
    signupsByMonth,
    usersByRole,
    recentUsers: [...users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  });
}
