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

/** Dự án user hiện tại được add (accessible) — cho thanh chọn dự án. Mọi vai trò gọi được. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const res = await callBackend("/rbac-projects/?pageSize=100");
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData<Project[]>(toArray<RawProject>(res.data).map(toProject));
}
