import type { NextRequest } from "next/server";

import {
  backendErrorMessage,
  callBackend,
  drfOrdering,
  toPaginated,
} from "@/shared/api/backend";
import { jsonData, jsonError, requireAuth } from "@/shared/api/server";
import { companyListQuerySchema } from "@/entities/company";
import type { Company } from "@/entities/company";
import type { Paginated } from "@/shared/api/types";

const ORDER_FIELD: Record<string, string> = {
  name: "name",
  createdAt: "created_at",
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "orgs:view");
  if ("response" in auth) return auth.response;

  const query = companyListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }
  const { page, pageSize, search, status, sortBy, sortOrder } = query.data;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  const ordering = drfOrdering(ORDER_FIELD[sortBy], sortOrder);
  if (ordering) params.set("ordering", ordering);

  const res = await callBackend(`/companies/?${params}`);
  if (!res.ok) return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));

  return jsonData<Paginated<Company>>(toPaginated<Company>(res.data, page, pageSize));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "orgs:manage");
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const res = await callBackend<Company>("/companies/", { method: "POST", body });
  if (!res.ok) {
    return jsonError(res.status || 502, "BACKEND_ERROR", backendErrorMessage(res.data));
  }
  return jsonData(res.data, { status: 201 });
}
