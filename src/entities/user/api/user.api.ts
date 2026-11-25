import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  User,
  CreatedUser,
  UserFormValues,
  UserListParams,
  UserOption,
  ProfileData,
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
  create: async (input: UserFormValues): Promise<CreatedUser> => {
    const res = await apiClient.post<ApiResponse<CreatedUser>>("/users", input);
    return res.data.data;
  },
  /** MAD-36 — Admin reset mật khẩu; trả về mật khẩu mới tự sinh (hiện 1 lần). */
  resetPassword: async (id: string): Promise<{ generatedPassword: string }> => {
    const res = await apiClient.post<ApiResponse<{ generatedPassword: string }>>(
      `/users/${id}/reset-password`,
    );
    return res.data.data;
  },
  update: async (id: string, input: Partial<UserFormValues>): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, input);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
  /** Searchable directory for the member picker; optional business-role filter. */
  lookup: async (search: string, role?: string): Promise<UserOption[]> => {
    const res = await apiClient.get<ApiResponse<UserOption[]>>(
      "/organization/users/lookup",
      { params: { search, ...(role ? { role } : {}) } },
    );
    return res.data.data;
  },
  /** Update the current user's own profile via PATCH /users/me. */
  updateProfile: async (data: Partial<ProfileData>): Promise<ProfileData> => {
    const res = await apiClient.patch<ApiResponse<ProfileData>>("/users/me", data);
    return res.data.data;
  },
};
