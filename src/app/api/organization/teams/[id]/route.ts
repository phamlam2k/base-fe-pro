import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { Team } from "@/entities/team";

type RouteParams = { params: Promise<{ id: string }> };

interface RawTeam {
  id: string;
  project: string;
  parentTeam: string | null;
  teamType: Team["teamType"];
  name: string;
  memberCount: number;
  createdAt: string;
}

function toTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    projectId: raw.project,
    parentTeamId: raw.parentTeam ?? null,
    teamType: raw.teamType,
    name: raw.name,
    memberCount: raw.memberCount ?? 0,
    createdAt: raw.createdAt,
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const res = await callBackend<RawTeam>(`/teams/${id}/`, {
    method: "PATCH",
    body: body ?? {},
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toTeam(res.data));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/teams/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
