import { queryOptions } from "@tanstack/react-query";

import { teamMemberApi } from "@/entities/team-member/api/team-member.api";

/** React-query query-options factory for the team-member entity. */
export const teamMemberQueries = {
  all: () => ["team-member"] as const,

  lists: () => [...teamMemberQueries.all(), "list"] as const,
  list: (teamId: string) =>
    queryOptions({
      queryKey: [...teamMemberQueries.lists(), teamId],
      queryFn: () => teamMemberApi.list(teamId),
      enabled: Boolean(teamId),
    }),
};
