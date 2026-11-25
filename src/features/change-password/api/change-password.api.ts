import { apiClient } from "@/shared/api/axios";

/** MAD-36 — gọi API đổi mật khẩu của chính người dùng đang đăng nhập. */
export const changePasswordApi = {
  async submit(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post("/auth/change-password", input);
  },
};
