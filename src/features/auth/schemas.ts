import { z } from "zod";

type TFn = (key: string) => string;

export function createLoginSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  return z.object({
    email: z
      .string()
      .min(1, { message: msg("validation.emailRequired", "Email is required") })
      .pipe(
        z.email({
          message: msg("validation.emailInvalid", "Enter a valid email address"),
        }),
      ),
    password: z
      .string()
      .min(1, { message: msg("validation.passwordRequired", "Password is required") }),
  });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
