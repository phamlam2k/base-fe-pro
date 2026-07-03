import { z } from "zod";

type TFn = (key: string) => string;

export const CAMPAIGN_OBJECTIVES = ["awareness", "traffic", "conversions"] as const;
export const CAMPAIGN_LOCATIONS = ["vn", "us", "eu", "jp", "global"] as const;

/** Per-step schemas: each step validates independently before advancing. */
export function createWizardSchemas(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  const basics = z.object({
    name: z
      .string()
      .min(3, { message: msg("validation.nameMin", "Campaign name must be at least 3 characters") }),
    objective: z.enum(CAMPAIGN_OBJECTIVES, {
      message: msg("validation.objectiveRequired", "Select an objective"),
    }),
  });

  const audience = z.object({
    locations: z
      .array(z.enum(CAMPAIGN_LOCATIONS))
      .min(1, { message: msg("validation.locationsMin", "Select at least one location") }),
    dailyBudget: z
      .number({ message: msg("validation.budgetRequired", "Enter a valid budget") })
      .min(5, { message: msg("validation.budgetMin", "Daily budget must be at least $5") }),
  });

  const review = z.object({
    terms: z.boolean().refine((value) => value, {
      message: msg("validation.termsRequired", "You must accept the terms"),
    }),
  });

  return { basics, audience, review };
}

type Schemas = ReturnType<typeof createWizardSchemas>;
export type WizardBasics = z.infer<Schemas["basics"]>;
export type WizardAudience = z.infer<Schemas["audience"]>;
export type WizardReview = z.infer<Schemas["review"]>;
export type WizardData = WizardBasics & WizardAudience & WizardReview;
