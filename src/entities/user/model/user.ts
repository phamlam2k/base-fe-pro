import { z } from "zod";

import type { ListParams } from "@/shared/api/types";

/**
 * Vai trò nghiệp vụ gán cho tài khoản khi Admin tạo (MAD-36). Khớp với
 * `AccountRole` ở backend (apps/accounts/models.py).
 */
export const ACCOUNT_ROLES = [
  "admin",
  "investor",
  "supervisor",
  "contractor",
  "lab",
] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/**
 * Quyền quản trị công ty (multi-tenant). Khớp `CompanyRole` backend. Company Admin
 * gán khi tạo: thành viên thường hoặc uỷ quyền (SubAdmin).
 */
export const COMPANY_ROLES = ["COMPANY_MEMBER", "COMPANY_DELEGATE"] as const;
export type CompanyRoleValue = (typeof COMPANY_ROLES)[number];
// COMPANY_ADMIN không chọn được trong form /users (chỉ SuperAdmin đặt qua "Tạo Admin"
// ở trang Công ty). Đưa vào enum schema để giá trị hợp lệ khi preset.
export const ALL_COMPANY_ROLES = [
  "COMPANY_MEMBER",
  "COMPANY_DELEGATE",
  "COMPANY_ADMIN",
] as const;

/**
 * Platform user entity (managed by SuperAdmin), backed by Django `accounts.User`
 * — see thiet-ke-phan-quyen-rbac.md §3. `isSuperAdmin` maps to `is_superuser`.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  role: AccountRole | "";
  mustChangePassword: boolean;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  /** Vai trò quản trị trong công ty (COMPANY_ADMIN/DELEGATE/MEMBER) — cho cột "Quyền". */
  companyRole?: string;
}

/** Kết quả tạo tài khoản: kèm mật khẩu tự sinh (chỉ trả 1 lần) để Admin bàn giao. */
export interface CreatedUser extends User {
  generatedPassword?: string;
}

/** Profile fields editable by the current user via PATCH /users/me. */
export interface ProfileData {
  fullName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  idNumber?: string | null;
  address?: string | null;
}

/** Minimal user info for the member picker (id / name / email). */
export interface UserOption {
  id: string;
  name: string;
  email: string;
}

export const SUPER_ADMIN_FILTERS = ["all", "yes", "no"] as const;
export type SuperAdminFilter = (typeof SUPER_ADMIN_FILTERS)[number];

export interface UserListParams extends ListParams {
  superAdmin?: SuperAdminFilter;
  sortBy?: "name" | "email" | "createdAt";
  /** Lọc theo công ty (id) + vai trò công ty — SuperAdmin xem admin của 1 công ty. */
  company?: string;
  companyRole?: string;
}

type TFn = (key: string) => string;

export function createUserFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.nameMin", "Họ tên tối thiểu 2 ký tự") }),
    email: z.email({ message: msg("validation.emailInvalid", "Email không hợp lệ") }),
    position: z.string().max(150).optional(),
    phone: z.string().max(30).optional(),
    // MAD-36: vai trò nghiệp vụ, bắt buộc chọn khi tạo tài khoản.
    role: z.enum(ACCOUNT_ROLES, {
      message: msg("validation.roleRequired", "Vui lòng chọn vai trò"),
    }),
    isSuperAdmin: z.boolean(),
    isActive: z.boolean(),
    // Multi-tenant (chỉ dùng khi TẠO): gán vào công ty nào (id — SuperAdmin chọn;
    // Company Admin bỏ qua, tự gán công ty mình) + quyền quản trị công ty.
    company: z.string().optional(),
    companyRole: z.enum(ALL_COMPANY_ROLES).optional(),
    // MAD-36: khi tạo tài khoản KHÔNG nhập mật khẩu — hệ thống tự sinh. Trường này
    // chỉ dùng khi sửa (để trống = giữ nguyên mật khẩu hiện tại).
    password: z
      .string()
      .refine((v) => v === "" || v.length >= 8, {
        message: msg("validation.passwordMin", "Mật khẩu tối thiểu 8 ký tự"),
      })
      .optional(),
  });
}
export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;

/** Query-string schema used by the Django proxy route (server-side). */
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  superAdmin: z.enum(SUPER_ADMIN_FILTERS).optional(),
  company: z.string().optional(),
  companyRole: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
