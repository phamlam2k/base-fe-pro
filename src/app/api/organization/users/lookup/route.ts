import type { NextRequest } from "next/server";

import { backendErrorMessage, callBackend, toArray } from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import type { UserOption } from "@/entities/user";

interface RawUser {
  id: string;
  fullName: string;
  email: string;
}

/** Searchable user directory for the member picker (org managers only). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const role = request.nextUrl.searchParams.get("role") ?? "";
  const params = new URLSearchParams({ pageSize: "20" });
  if (search) params.set("search", search);
  // Lọc theo vai trò nghiệp vụ (TVGS/NT/PTN/CĐT) khi picker cần đúng role.
  if (role) params.set("role", role);

  const res = await callBackend(`/user-lookup/?${params}`);
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }

  const users = toArray<RawUser>(res.data).map<UserOption>((u) => ({
    id: u.id,
    name: u.fullName ?? "",
    email: u.email,
  }));
  return jsonData<UserOption[]>(users);
}
