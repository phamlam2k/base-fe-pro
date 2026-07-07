/**
 * Public API của feature `users`.
 *
 * Đây là "cửa chính": mọi code bên ngoài feature (app/, features khác) chỉ
 * được import từ file này — ESLint chặn deep import (eslint.config.mjs).
 * Những gì KHÔNG export ở đây (user-columns, nội bộ users-view...) là
 * implementation detail, được phép refactor thoải mái mà không sợ gãy nơi khác.
 */
export { UsersView } from "./components/users-view";
export { UserFormDialog } from "./components/user-form-dialog";

export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "./hooks";

// Entity data-access (query-options factory) lives in the `user` entity.
export { userApi, userQueries } from "@/entities/user";

export { SUPER_ADMIN_FILTERS } from "./types";
export type { User, SuperAdminFilter, UserListParams } from "./types";
