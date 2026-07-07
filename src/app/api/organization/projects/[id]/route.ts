import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { Project } from "@/entities/project";

type RouteParams = { params: Promise<{ id: string }> };

interface RawProject {
  id: string;
  company: string;
  name: string;
  status: Project["status"];
  teamCount: number;
  createdAt: string;
}

function toProject(raw: RawProject): Project {
  return {
    id: raw.id,
    companyId: raw.company,
    name: raw.name,
    status: raw.status,
    teamCount: raw.teamCount ?? 0,
    createdAt: raw.createdAt,
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { name?: string; status?: string }
    | null;
  const res = await callBackend<RawProject>(`/rbac-projects/${id}/`, {
    method: "PATCH",
    body: body ?? {},
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toProject(res.data));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/rbac-projects/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
