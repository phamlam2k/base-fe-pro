import type { NextRequest } from "next/server";

import {
  backendErrorMessage,
  callBackend,
  drfOrdering,
  toPaginated,
} from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { userListQuerySchema } from "@/entities/user";
import type { User } from "@/entities/user";
import type { Paginated } from "@/shared/api/types";

/** Django user (camelized) → the console's User shape. */
interface RawUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  dateJoined: string;
}

function toUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.fullName ?? "",
    email: raw.email,
    phone: raw.phone ?? "",
    isSuperAdmin: raw.isSuperAdmin,
    isActive: raw.isActive,
    createdAt: raw.dateJoined,
  };
}

const ORDER_FIELD: Record<string, string> = {
  name: "full_name",
  email: "email",
  createdAt: "date_joined",
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "users:view");
  if ("response" in auth) return auth.response;

  const query = userListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }
  const { page, pageSize, search, superAdmin, sortBy, sortOrder } = query.data;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);
  if (superAdmin === "yes") params.set("is_superuser", "true");
  if (superAdmin === "no") params.set("is_superuser", "false");
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
  const auth = requireAuth(request, "users:create");
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        phone?: string;
        isSuperAdmin?: boolean;
        isActive?: boolean;
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
      phone: body.phone ?? "",
      isSuperAdmin: body.isSuperAdmin ?? false,
      isActive: body.isActive ?? true,
      password: body.password || "",
    },
  });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(toUser(res.data), { status: 201 });
}
