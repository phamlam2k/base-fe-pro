import { z } from "zod";

import { SUPER_ADMIN_FILTERS } from "@/features/users/types";

/**
 * Schema factory: the client passes a translator (scoped to the `users`
 * namespace) for localized messages; server-side validation calls it without
 * arguments and gets the English fallbacks.
 */
type TFn = (key: string) => string;

export function createUserFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.nameMin", "Họ tên tối thiểu 2 ký tự") }),
    email: z.email({ message: msg("validation.emailInvalid", "Email không hợp lệ") }),
    phone: z.string().max(30).optional(),
    isSuperAdmin: z.boolean(),
    isActive: z.boolean(),
    // Optional — blank keeps the current password on edit; on create a blank
    // means "no password yet" (the account can't log in until one is set).
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
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
