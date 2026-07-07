import { z } from "zod";

/** Project (site) entity model. Status mirrors ACTIVE/SUSPENDED. */
export const PROJECT_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: string;
  companyId: string;
  name: string;
  status: ProjectStatus;
  teamCount: number;
  createdAt: string;
}

type TFn = (key: string) => string;

export function createProjectFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.projectNameMin", "Tên dự án tối thiểu 2 ký tự") }),
  });
}
export type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>;
