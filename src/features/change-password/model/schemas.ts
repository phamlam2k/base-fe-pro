import { z } from "zod";

type TFn = (key: string) => string;

/** MAD-36 — schema đổi mật khẩu (ép đổi lần đầu / đổi thường ngày). */
export function createChangePasswordSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z
    .object({
      currentPassword: z.string().min(1, {
        message: msg("validation.currentRequired", "Nhập mật khẩu hiện tại"),
      }),
      newPassword: z.string().min(8, {
        message: msg("validation.newMin", "Mật khẩu mới tối thiểu 8 ký tự"),
      }),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      path: ["confirmPassword"],
      message: msg("validation.mismatch", "Xác nhận mật khẩu không khớp"),
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
      path: ["newPassword"],
      message: msg("validation.sameAsOld", "Mật khẩu mới phải khác mật khẩu hiện tại"),
    });
}

export type ChangePasswordValues = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
