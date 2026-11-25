import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { User } from "@/entities/user";

type RouteParams = { params: Promise<{ id: string }> };

interface RawUser {
  id: string;
  email: string;
  fullName: string;
  position: string;
  phone: string;
  role: User["role"];
  mustChangePassword: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  dateJoined: string;
}

function toUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.fullName ?? "",
    email: raw.email,
    position: raw.position ?? "",
    phone: raw.phone ?? "",
    role: raw.role ?? "",
    mustChangePassword: raw.mustChangePassword ?? false,
    isSuperAdmin: raw.isSuperAdmin,
    isActive: raw.isActive,
    createdAt: raw.dateJoined,
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, ["users:update", "companies:manage"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        position?: string;
        phone?: string;
        role?: User["role"];
        isSuperAdmin?: boolean;
        isActive?: boolean;
        password?: string;
      }
    | null;

  const payload: Record<string, unknown> = {};
  if (body?.name !== undefined) payload.fullName = body.name;
  if (body?.email !== undefined) payload.email = body.email;
  if (body?.position !== undefined) payload.position = body.position;
  if (body?.phone !== undefined) payload.phone = body.phone;
  if (body?.role !== undefined) payload.role = body.role;
  if (body?.isSuperAdmin !== undefined) payload.isSuperAdmin = body.isSuperAdmin;
  if (body?.isActive !== undefined) payload.isActive = body.isActive;
  if (body?.password) payload.password = body.password;

  const res = await callBackend<RawUser>(`/users/${id}/`, {
    method: "PATCH",
    body: payload,
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toUser(res.data));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, ["users:delete", "companies:manage"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const res = await callBackend(`/users/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(null);
}
