import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { companyMemberApi } from "@/entities/company-member/api/company-member.api";
import type { MemberListParams } from "@/entities/company-member/model/company-member";

/** React-query query-options factory for the company-member entity. */
export const companyMemberQueries = {
  all: () => ["company-member"] as const,

  lists: () => [...companyMemberQueries.all(), "list"] as const,
  list: (params: MemberListParams) =>
    queryOptions({
      queryKey: [...companyMemberQueries.lists(), params],
      queryFn: () => companyMemberApi.list(params),
      placeholderData: keepPreviousData,
      enabled: Boolean(params.companyId),
    }),
};
