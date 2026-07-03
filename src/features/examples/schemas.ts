import { z } from "zod";

type TFn = (key: string) => string;

export const PROJECT_CATEGORIES = ["web", "mobile", "design", "marketing"] as const;
export const PROJECT_PRIORITIES = ["low", "medium", "high"] as const;

export function createProjectSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  return z.object({
    name: z
      .string()
      .min(3, { message: msg("validation.nameMin", "Project name must be at least 3 characters") }),
    description: z
      .string()
      .max(500, { message: msg("validation.descriptionMax", "Description must be at most 500 characters") }),
    category: z
      .string()
      .min(1, { message: msg("validation.categoryRequired", "Select a category") }),
    deadline: z
      .date({ message: msg("validation.deadlineRequired", "Pick a deadline") })
      .refine((date) => date.getTime() > Date.now(), {
        message: msg("validation.deadlineFuture", "Deadline must be in the future"),
      }),
    priority: z.enum(PROJECT_PRIORITIES),
    notifications: z.boolean(),
    terms: z.boolean().refine((value) => value, {
      message: msg("validation.termsRequired", "You must accept the terms"),
    }),
  });
}

export type ProjectFormValues = z.infer<ReturnType<typeof createProjectSchema>>;
