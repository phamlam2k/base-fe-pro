import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend, toArray } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { teamFromBackend as toTeam, type RawTeam, type Team } from "@/entities/team";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "projects:view");
  if ("response" in auth) return auth.response;

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return jsonError(422, "VALIDATION_ERROR", "projectId is required.");
  }

  const res = await callBackend(
    `/teams/?project=${encodeURIComponent(projectId)}&pageSize=100`,
  );
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  return jsonData<Team[]>(toArray<RawTeam>(res.data).map(toTeam));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | {
        projectId?: string;
        name?: string;
        teamType?: string;
        placements?: Array<{ parentTeam: string; package: string | null }>;
      }
    | null;
  if (!body?.projectId || !body.name || !body.teamType) {
    return jsonError(422, "VALIDATION_ERROR", "Missing team fields.");
  }

  const res = await callBackend<RawTeam>("/teams/", {
    method: "POST",
    body: {
      project: body.projectId,
      name: body.name,
      teamType: body.teamType,
      // Nhiều cha: mỗi phần tử = 1 vị trí (nhóm cha + Hợp đồng).
      placements: body.placements ?? [],
    },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toTeam(res.data), { status: 201 });
}
