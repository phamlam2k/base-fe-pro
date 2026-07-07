import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend, toArray } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { ProjectMember } from "@/features/organization/types";

interface RawProjectMember {
  id: string;
  project: string;
  companyMember: string;
  companyMemberDetail?: { name?: string; email?: string };
  role: string;
  createdAt: string;
}

function toProjectMember(raw: RawProjectMember): ProjectMember {
  return {
    id: raw.id,
    projectId: raw.project,
    companyMemberId: raw.companyMember,
    name: raw.companyMemberDetail?.name ?? "",
    email: raw.companyMemberDetail?.email ?? "",
    role: raw.role,
    createdAt: raw.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "orgs:view");
  if ("response" in auth) return auth.response;

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return jsonError(422, "VALIDATION_ERROR", "projectId is required.");
  }

  const res = await callBackend(
    `/project-members/?project=${encodeURIComponent(projectId)}&pageSize=100`,
  );
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  return jsonData<ProjectMember[]>(
    toArray<RawProjectMember>(res.data).map(toProjectMember),
  );
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { projectId?: string; companyMemberId?: string }
    | null;
  if (!body?.projectId || !body.companyMemberId) {
    return jsonError(422, "VALIDATION_ERROR", "Missing project member fields.");
  }

  const res = await callBackend<RawProjectMember>("/project-members/", {
    method: "POST",
    body: { project: body.projectId, companyMember: body.companyMemberId },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toProjectMember(res.data), { status: 201 });
}
