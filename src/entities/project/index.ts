/** Public API of the `project` entity (FSD). */
export { projectApi } from "./api/project.api";
export { projectQueries } from "./api/project.queries";
export { PROJECT_STATUSES, createProjectFormSchema } from "./model/project";
export type { Project, ProjectStatus, ProjectFormValues } from "./model/project";
