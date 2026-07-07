import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend, toArray } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { TeamMember } from "@/features/organization/types";

interface RawTeamMember {
  id: string;
  team: string;
  name: string;
  email: string;
  role: TeamMember["role"];
  createdAt: string;
}

function toTeamMember(raw: RawTeamMember): TeamMember {
  return {
    id: raw.id,
    teamId: raw.team,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    createdAt: raw.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "orgs:view");
  if ("response" in auth) return auth.response;

  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return jsonError(422, "VALIDATION_ERROR", "teamId is required.");
  }

  const res = await callBackend(
    `/team-members/?team=${encodeURIComponent(teamId)}&pageSize=100`,
  );
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  return jsonData<TeamMember[]>(toArray<RawTeamMember>(res.data).map(toTeamMember));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { teamId?: string; userId?: string; role?: string }
    | null;
  if (!body?.teamId || !body.userId || !body.role) {
    return jsonError(422, "VALIDATION_ERROR", "Missing team member fields.");
  }

  // The user is picked from existing accounts → attach by id.
  const res = await callBackend<RawTeamMember>("/team-members/", {
    method: "POST",
    body: { team: body.teamId, user: body.userId, role: body.role },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toTeamMember(res.data), { status: 201 });
}
