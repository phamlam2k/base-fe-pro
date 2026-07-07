import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  User,
  UserFormValues,
  UserListParams,
  UserOption,
} from "@/entities/user/model/user";

/** Raw HTTP calls for the User entity. */
export const userApi = {
  list: async (params: UserListParams): Promise<Paginated<User>> => {
    const res = await apiClient.get<ApiResponse<Paginated<User>>>("/users", { params });
    return res.data.data;
  },
  getById: async (id: string): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },
  create: async (input: UserFormValues): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>("/users", input);
    return res.data.data;
  },
  update: async (id: string, input: Partial<UserFormValues>): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, input);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
  /** Searchable directory for the member picker. */
  lookup: async (search: string): Promise<UserOption[]> => {
    const res = await apiClient.get<ApiResponse<UserOption[]>>(
      "/organization/users/lookup",
      { params: { search } },
    );
    return res.data.data;
  },
};
