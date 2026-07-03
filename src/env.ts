import { z } from "zod";

/**
 * Validated environment access (hand-rolled t3-env pattern).
 * Import `env` instead of reading `process.env` directly — a typo or a
 * missing var fails fast at startup instead of silently breaking at runtime.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so each one must be
 * referenced explicitly (no dynamic `process.env[name]` on the client).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
});

export const env = clientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
