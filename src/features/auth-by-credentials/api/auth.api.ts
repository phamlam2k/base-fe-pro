import { apiClient } from "@/shared/api/axios";
import type { SessionUser } from "@/entities/session";
import type { ApiResponse } from "@/shared/api/types";
import type { LoginValues } from "@/features/auth-by-credentials/model/schemas";

export const authApi = {
  async login(input: LoginValues): Promise<SessionUser> {
    const response = await apiClient.post<ApiResponse<SessionUser>>(
      "/auth/login",
      input,
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async me(): Promise<SessionUser> {
    const response = await apiClient.get<ApiResponse<SessionUser>>("/auth/me");
    return response.data.data;
  },
};
