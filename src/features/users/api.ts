import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type { UserFormValues } from "@/features/users/schemas";
import type { User, UserListParams } from "@/features/users/types";

/** Raw HTTP calls — no caching concerns here, just the contract. */
export const usersApi = {
  async list(params: UserListParams): Promise<Paginated<User>> {
    const response = await apiClient.get<ApiResponse<Paginated<User>>>(
      "/users",
      { params },
    );
    return response.data.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async create(input: UserFormValues): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>("/users", input);
    return response.data.data;
  },

  async update(id: string, input: Partial<UserFormValues>): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}`,
      input,
    );
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

/**
 * Query-key factory — hierarchical so invalidating `userKeys.all` clears
 * every users query. Never write inline query keys in components.
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function userListOptions(params: UserListParams) {
  return queryOptions({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
    // Keep the previous page rendered while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function userDetailOptions(id: string) {
  return queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
  });
}
