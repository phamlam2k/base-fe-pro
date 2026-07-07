import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { TeamMember } from "@/features/organization/types";

type RouteParams = { params: Promise<{ id: string }> };

interface RawTeamMember {
  id: string;
  team: string;
  name: string;
  email: string;
  role: TeamMember["role"];
  createdAt: string;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { role?: string; name?: string }
    | null;
  const payload: Record<string, unknown> = {};
  if (body?.role) payload.role = body.role;
  if (body?.name) payload.inviteName = body.name;

  const res = await callBackend<RawTeamMember>(`/team-members/${id}/`, {
    method: "PATCH",
    body: payload,
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  const raw = res.data;
  return jsonData<TeamMember>({
    id: raw.id,
    teamId: raw.team,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    createdAt: raw.createdAt,
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/team-members/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
