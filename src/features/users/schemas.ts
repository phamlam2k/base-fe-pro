import { z } from "zod";

import { ROLES } from "@/config/permissions";
import { USER_STATUSES } from "@/features/users/types";

/**
 * Schema factory pattern: the client passes a translator (scoped to the
 * `users` namespace) for localized messages; server-side validation calls it
 * without arguments and gets the English fallbacks.
 */
type TFn = (key: string) => string;

export function createUserFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.nameMin", "Name must be at least 2 characters") }),
    email: z.email({
      message: msg("validation.emailInvalid", "Enter a valid email address"),
    }),
    role: z.enum(ROLES, {
      message: msg("validation.roleRequired", "Select a role"),
    }),
    status: z.enum(USER_STATUSES, {
      message: msg("validation.statusRequired", "Select a status"),
    }),
  });
}

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;

/** Query-string schema used by the mock API route (server-side). */
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum([...ROLES, "all"]).optional(),
  status: z.enum([...USER_STATUSES, "all"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
