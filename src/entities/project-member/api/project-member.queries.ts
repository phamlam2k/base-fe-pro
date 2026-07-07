import { queryOptions } from "@tanstack/react-query";

import { projectMemberApi } from "@/entities/project-member/api/project-member.api";

/** React-query query-options factory for the project-member entity. */
export const projectMemberQueries = {
  all: () => ["project-member"] as const,

  lists: () => [...projectMemberQueries.all(), "list"] as const,
  list: (projectId: string) =>
    queryOptions({
      queryKey: [...projectMemberQueries.lists(), projectId],
      queryFn: () => projectMemberApi.list(projectId),
      enabled: Boolean(projectId),
    }),
};
