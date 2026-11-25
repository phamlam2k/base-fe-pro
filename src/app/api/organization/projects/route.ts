import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend, toArray } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { Project } from "@/entities/project";

interface RawProject {
  id: string;
  company: string;
  name: string;
  status: Project["status"];
  location: string;
  contractPackage: string;
  teamCount: number;
  createdAt: string;
}

function toProject(raw: RawProject): Project {
  return {
    id: raw.id,
    companyId: raw.company,
    name: raw.name,
    status: raw.status,
    location: raw.location ?? "",
    contractPackage: raw.contractPackage ?? "",
    teamCount: raw.teamCount ?? 0,
    createdAt: raw.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "projects:view");
  if ("response" in auth) return auth.response;

  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return jsonError(422, "VALIDATION_ERROR", "companyId is required.");
  }

  const res = await callBackend(
    `/rbac-projects/?company=${encodeURIComponent(companyId)}&pageSize=100`,
  );
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  return jsonData<Project[]>(toArray<RawProject>(res.data).map(toProject));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { name?: string; companyId?: string; location?: string; contractPackage?: string }
    | null;
  if (!body?.companyId || !body.name) {
    return jsonError(422, "VALIDATION_ERROR", "Missing project fields.");
  }

  const res = await callBackend<RawProject>("/rbac-projects/", {
    method: "POST",
    body: {
      company: body.companyId,
      name: body.name,
      location: body.location ?? "",
      contractPackage: body.contractPackage ?? "",
    },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toProject(res.data), { status: 201 });
}
