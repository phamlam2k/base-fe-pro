import type { NextRequest } from "next/server";

import {
  backendErrorMessage,
  callBackend,
  drfOrdering,
  toPaginated,
} from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { memberListQuerySchema } from "@/entities/company-member";
import type { Member } from "@/entities/company-member";
import type { Paginated } from "@/shared/api/types";

/** Django CompanyMember (camelized) → the console's flat Member shape. */
interface RawMember {
  id: string;
  company: string;
  name: string;
  email: string;
  role: Member["role"];
  businessRole: string;
  customTitle: string;
  createdAt: string;
}

function toMember(raw: RawMember): Member {
  return {
    id: raw.id,
    companyId: raw.company,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    businessRole: raw.businessRole ?? "",
    customTitle: raw.customTitle ?? "",
    createdAt: raw.createdAt,
  };
}

const ORDER_FIELD: Record<string, string> = { createdAt: "created_at", role: "role" };

export async function GET(request: NextRequest) {
  // Dùng cho ProjectMembersCard (chọn thành viên gán dự án) — manager có projects:view.
  const auth = requireAuth(request, ["orgs:view", "projects:view"]);
  if ("response" in auth) return auth.response;

  const query = memberListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }
  const { companyId, page, pageSize, search, role, sortBy, sortOrder } = query.data;

  const params = new URLSearchParams({
    company: companyId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);
  if (role && role !== "all") params.set("role", role);
  const ordering = drfOrdering(ORDER_FIELD[sortBy], sortOrder);
  if (ordering) params.set("ordering", ordering);

  const res = await callBackend(`/company-members/?${params}`);
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  const paginated = toPaginated<RawMember>(res.data, page, pageSize);
  return jsonData<Paginated<Member>>({
    ...paginated,
    items: paginated.items.map(toMember),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { userId?: string; role?: string; customTitle?: string; companyId?: string }
    | null;
  if (!body?.companyId || !body.userId || !body.role) {
    return jsonError(422, "VALIDATION_ERROR", "Missing member fields.");
  }

  // The user is picked from existing accounts → attach by id.
  const res = await callBackend<RawMember>("/company-members/", {
    method: "POST",
    body: {
      company: body.companyId,
      user: body.userId,
      role: body.role,
      customTitle: body.customTitle ?? "",
    },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toMember(res.data), { status: 201 });
}
