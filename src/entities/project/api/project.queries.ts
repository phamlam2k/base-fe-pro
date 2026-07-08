import { queryOptions } from "@tanstack/react-query";

import { projectApi } from "@/entities/project/api/project.api";

/** React-query query-options factory for the Project entity. */
export const projectQueries = {
  all: () => ["project"] as const,

  lists: () => [...projectQueries.all(), "list"] as const,
  list: (companyId: string) =>
    queryOptions({
      queryKey: [...projectQueries.lists(), companyId],
      queryFn: () => projectApi.list(companyId),
      enabled: Boolean(companyId),
    }),

  zoneKeys: () => [...projectQueries.all(), "zone"] as const,
  zones: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.zoneKeys(), id],
      queryFn: () => projectApi.getZones(id),
      enabled: Boolean(id),
    }),
};
