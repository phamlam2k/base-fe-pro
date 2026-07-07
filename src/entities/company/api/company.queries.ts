import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { companyApi } from "@/entities/company/api/company.api";
import type { CompanyListParams } from "@/entities/company/model/company";

/**
 * React-query **query-options factory** for the Company entity.
 * One factory per entity: invalidate `companyQueries.all()` to clear everything,
 * or narrower helpers for precise invalidation. Never write inline query keys.
 */
export const companyQueries = {
  all: () => ["company"] as const,

  lists: () => [...companyQueries.all(), "list"] as const,
  list: (params: CompanyListParams) =>
    queryOptions({
      queryKey: [...companyQueries.lists(), params],
      queryFn: () => companyApi.list(params),
      placeholderData: keepPreviousData,
    }),
};
