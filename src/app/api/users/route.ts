import type { NextRequest } from "next/server";

import {
  backendErrorMessage,
  callBackend,
  drfOrdering,
  toPaginated,
} from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { userListQuerySchema } from "@/entities/user";
import type { CreatedUser, User } from "@/entities/user";
import type { Paginated } from "@/shared/api/types";

/** Django user (camelized) → the console's User shape. */
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
  generatedPassword?: string;
  companyDetail?: { id: string; name: string; companyRole: string } | null;
}

// map Django user (camelized) → User; companyRole lấy từ companyDetail cho cột "Quyền".
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
    companyRole: raw.companyDetail?.companyRole,
  };
}

const ORDER_FIELD: Record<string, string> = {
  name: "full_name",
  email: "email",
  createdAt: "date_joined",
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ["users:view", "companies:manage"]);
  if ("response" in auth) return auth.response;

  const query = userListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }
  const { page, pageSize, search, superAdmin, company, companyRole, sortBy, sortOrder } =
    query.data;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);
  if (superAdmin === "yes") params.set("is_superuser", "true");
  if (superAdmin === "no") params.set("is_superuser", "false");
  // Lọc theo công ty + vai trò công ty (SuperAdmin xem admin của 1 công ty).
  if (company) params.set("company", company);
  if (companyRole) params.set("company_role", companyRole);
  const ordering = drfOrdering(ORDER_FIELD[sortBy], sortOrder);
  if (ordering) params.set("ordering", ordering);

  const res = await callBackend(`/users/?${params}`);
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  const paginated = toPaginated<RawUser>(res.data, page, pageSize);
  return jsonData<Paginated<User>>({
    ...paginated,
    items: paginated.items.map(toUser),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ["users:create", "companies:manage"]);
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        position?: string;
        phone?: string;
        role?: User["role"];
        isSuperAdmin?: boolean;
        isActive?: boolean;
        company?: string;
        companyRole?: string;
        password?: string;
      }
    | null;
  if (!body?.email) {
    return jsonError(422, "VALIDATION_ERROR", "Email is required.");
  }

  const res = await callBackend<RawUser>("/users/", {
    method: "POST",
    body: {
      email: body.email,
      fullName: body.name ?? "",
      position: body.position ?? "",
      phone: body.phone ?? "",
      role: body.role ?? "",
      isSuperAdmin: body.isSuperAdmin ?? false,
      isActive: body.isActive ?? true,
      // Multi-tenant: gán vào công ty nào (SuperAdmin chọn) + quyền công ty
      // (→ backend `company` / `company_role`). Bỏ qua nếu trống.
      ...(body.company ? { company: body.company } : {}),
      ...(body.companyRole ? { companyRole: body.companyRole } : {}),
      // MAD-36: bỏ trống → backend tự sinh mật khẩu và ép đổi lần đầu.
      password: body.password || "",
    },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  // Kèm generatedPassword (mật khẩu tự sinh) để Admin bàn giao — hiện 1 lần.
  const created: CreatedUser = {
    ...toUser(res.data),
    generatedPassword: res.data.generatedPassword,
  };
  return jsonData(created, { status: 201 });
}
