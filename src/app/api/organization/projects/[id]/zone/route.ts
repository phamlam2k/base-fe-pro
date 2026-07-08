import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { projectZonesSchema, type ProjectZones } from "@/entities/project";
import { getProjectZonesDb } from "@/mocks/project-zones";

/**
 * Project zones (site boundaries — a project may have several). Admin-only
 * (`projects:manage-zone`).
 *
 * Talks to the real Django endpoint `GET/PATCH /rbac-projects/:id/zone/`
 * (SuperAdmin, PostGIS-free JSON polygon list). Falls back to the in-memory
 * mock only when that endpoint isn't reachable yet (network error or 404) so
 * local dev keeps working before the backend ships. Contract:
 * `{ projectId, polygons, updatedAt }` + PATCH body `{ polygons }`.
 */
type RouteParams = { params: Promise<{ id: string }> };

function readMock(id: string): ProjectZones {
  const stored = getProjectZonesDb().get(id);
  return {
    projectId: id,
    polygons: (stored?.polygons as ProjectZones["polygons"]) ?? [],
    updatedAt: stored?.updatedAt ?? null,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "projects:manage-zone");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    const res = await callBackend<ProjectZones>(`/rbac-projects/${id}/zone/`, {
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
  const parsed = projectZonesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(422, "VALIDATION", "Danh sách vùng không hợp lệ (GeoJSON Polygon).");
  }
  const { polygons } = parsed.data;

  const writeMock = (): ProjectZones => {
    const updatedAt = new Date().toISOString();
    getProjectZonesDb().set(id, { polygons, updatedAt });
    return { projectId: id, polygons, updatedAt };
  };

  try {
    const res = await callBackend<ProjectZones>(`/rbac-projects/${id}/zone/`, {
      method: "PATCH",
      body: { polygons },
    });
    if (res.ok) return jsonData(res.data);
    if (res.status === 404) return jsonData(writeMock());
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  } catch {
    return jsonData(writeMock());
  }
}
