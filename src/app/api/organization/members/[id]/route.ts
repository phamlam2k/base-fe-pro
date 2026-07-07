import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { Member } from "@/features/organization/types";

type RouteParams = { params: Promise<{ id: string }> };

interface RawMember {
  id: string;
  company: string;
  name: string;
  email: string;
  role: Member["role"];
  customTitle: string;
  createdAt: string;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { name?: string; role?: string; customTitle?: string }
    | null;

  // Only role / title / display name are editable on a membership.
  const payload: Record<string, unknown> = {};
  if (body?.role) payload.role = body.role;
  if (body?.customTitle !== undefined) payload.customTitle = body.customTitle;
  if (body?.name) payload.inviteName = body.name;

  const res = await callBackend<RawMember>(`/company-members/${id}/`, {
    method: "PATCH",
    body: payload,
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  const raw = res.data;
  return jsonData<Member>({
    id: raw.id,
    companyId: raw.company,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    customTitle: raw.customTitle ?? "",
    createdAt: raw.createdAt,
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/company-members/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
