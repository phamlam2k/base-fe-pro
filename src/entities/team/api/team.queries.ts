import { queryOptions } from "@tanstack/react-query";

import { teamApi } from "@/entities/team/api/team.api";

/** React-query query-options factory for the Team entity. */
export const teamQueries = {
  all: () => ["team"] as const,

  lists: () => [...teamQueries.all(), "list"] as const,
  list: (projectId: string) =>
    queryOptions({
      queryKey: [...teamQueries.lists(), projectId],
      queryFn: () => teamApi.list(projectId),
      enabled: Boolean(projectId),
    }),
};
