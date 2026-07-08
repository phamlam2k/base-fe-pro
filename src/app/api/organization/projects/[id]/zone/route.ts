import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { projectZoneSchema, type ProjectZone } from "@/entities/project";
import { getProjectZonesDb } from "@/mocks/project-zones";

/**
 * Project zone (site boundary). Admin-only (`projects:manage-zone`).
 *
 * Talks to the real Django endpoint `GET/PATCH /rbac-projects/:id/zone/`
 * (SuperAdmin, PostGIS-free JSON polygon). Falls back to the in-memory mock
 * ONLY when that endpoint isn't reachable yet (network error or 404) so local
 * dev keeps working before the backend ships. The contract (GeoJSON Polygon,
 * `{ projectId, polygon, updatedAt }`) is identical either way.
 */
type RouteParams = { params: Promise<{ id: string }> };

function readMock(id: string): ProjectZone {
  const stored = getProjectZonesDb().get(id);
  return {
    projectId: id,
    polygon: (stored?.polygon as ProjectZone["polygon"]) ?? null,
    updatedAt: stored?.updatedAt ?? null,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "projects:manage-zone");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const res = await callBackend<ProjectZone>(`/rbac-projects/${id}/zone/`, {
      method: "GET",
    });
    if (res.ok) return jsonData(res.data);
    if (res.status === 404) return jsonData(readMock(id));
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  } catch {
    return jsonData(readMock(id));
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "projects:manage-zone");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const parsed = projectZoneSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(422, "VALIDATION", "Vùng không hợp lệ (GeoJSON Polygon).");
  }
  const { polygon } = parsed.data;

  const writeMock = (): ProjectZone => {
    const updatedAt = new Date().toISOString();
    getProjectZonesDb().set(id, { polygon, updatedAt });
    return { projectId: id, polygon, updatedAt };
  };

  try {
    const res = await callBackend<ProjectZone>(`/rbac-projects/${id}/zone/`, {
      method: "PATCH",
      body: { polygon },
    });
    if (res.ok) return jsonData(res.data);
    if (res.status === 404) return jsonData(writeMock());
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  } catch {
    return jsonData(writeMock());
  }
}
