import type { NextRequest } from "next/server";

import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { projectZoneSchema, type ProjectZone } from "@/entities/project";
import { getProjectZonesDb } from "@/mocks/project-zones";

/**
 * Project zone (site boundary). Admin-only (`projects:manage-zone`).
 *
 * Self-contained mock store — see `src/mocks/project-zones.ts`. Swap the body
 * to `callBackend("/rbac-projects/:id/zone/")` once the Django PostGIS endpoint
 * exists; the contract (GeoJSON Polygon) stays the same.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "projects:manage-zone");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const stored = getProjectZonesDb().get(id);
  return jsonData<ProjectZone>({
    projectId: id,
    polygon: (stored?.polygon as ProjectZone["polygon"]) ?? null,
    updatedAt: stored?.updatedAt ?? null,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "projects:manage-zone");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const parsed = projectZoneSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(422, "VALIDATION", "Vùng không hợp lệ (GeoJSON Polygon).");
  }

  const updatedAt = new Date().toISOString();
  getProjectZonesDb().set(id, { polygon: parsed.data.polygon, updatedAt });
  return jsonData<ProjectZone>({ projectId: id, polygon: parsed.data.polygon, updatedAt });
}
