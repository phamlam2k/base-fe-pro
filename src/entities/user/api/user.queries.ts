import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { userApi } from "@/entities/user/api/user.api";
import type { UserListParams } from "@/entities/user/model/user";

/** React-query query-options factory for the User entity. */
export const userQueries = {
  all: () => ["user"] as const,

  lists: () => [...userQueries.all(), "list"] as const,
  list: (params: UserListParams) =>
    queryOptions({
      queryKey: [...userQueries.lists(), params],
      queryFn: () => userApi.list(params),
      placeholderData: keepPreviousData,
    }),

  details: () => [...userQueries.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...userQueries.details(), id],
      queryFn: () => userApi.getById(id),
    }),

  lookups: () => [...userQueries.all(), "lookup"] as const,
  lookup: (search: string) =>
    queryOptions({
      queryKey: [...userQueries.lookups(), search],
      queryFn: () => userApi.lookup(search),
      placeholderData: keepPreviousData,
    }),
};
