import { z } from "zod";

/** Project (site) entity model. Status mirrors ACTIVE/SUSPENDED. */
export const PROJECT_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: string;
  companyId: string;
  name: string;
  status: ProjectStatus;
  // Địa điểm + Gói thầu cấp dự án (nhập 1 lần) → tự điền vào mẫu PDF.
  location: string;
  contractPackage: string;
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
    location: z.string().max(255).optional(),
    contractPackage: z.string().max(255).optional(),
  });
}
export type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>;

/**
 * Project zones — the geographic boundaries of a site. A project can have
 * SEVERAL disjoint areas, stored as a list of GeoJSON Polygons (RFC 7946:
 * rings of `[lng, lat]`, outer ring first, closed). Mobile checks a site
 * photo's GPS against ANY of them. Display names ("Vùng 1..N") are derived
 * from order — not stored.
 */
export interface GeoPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface ProjectZoneItem {
  name: string;
  polygon: GeoPolygon;
}

export interface ProjectZones {
  projectId: string;
  zones: ProjectZoneItem[];
  updatedAt: string | null;
}

const geoPositionSchema = z.tuple([z.number(), z.number()]);
export const geoPolygonSchema = z.object({
  type: z.literal("Polygon"),
  // Each linear ring needs ≥4 positions (a triangle + the closing point).
  coordinates: z.array(geoPositionSchema.array().min(4)).min(1),
});
export const projectZonesSchema = z.object({
  zones: z.array(z.object({ name: z.string().min(1), polygon: geoPolygonSchema })),
});
