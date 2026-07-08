/** Public API of the `project` entity (FSD). */
export { projectApi } from "./api/project.api";
export { projectQueries } from "./api/project.queries";
export {
  PROJECT_STATUSES,
  createProjectFormSchema,
  geoPolygonSchema,
  projectZoneSchema,
} from "./model/project";
export type {
  Project,
  ProjectStatus,
  ProjectFormValues,
  GeoPolygon,
  ProjectZone,
} from "./model/project";
