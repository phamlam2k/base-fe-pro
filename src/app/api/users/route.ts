import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import {
  createUserFormSchema,
  userListQuerySchema,
} from "@/features/users/schemas";
import { allocateUserId, getDb, simulateLatency, type DbUser } from "@/mocks/db";
import type { Paginated } from "@/types/api";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, "users:view");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const query = userListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return jsonError(422, "VALIDATION_ERROR", "Invalid query parameters.");
  }

  const { page, pageSize, search, role, status, sortBy, sortOrder } =
    query.data;

  let users = [...getDb().users];

  if (search) {
    const needle = search.toLowerCase();
    users = users.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle),
    );
  }
  if (role && role !== "all") {
    users = users.filter((user) => user.role === role);
  }
  if (status && status !== "all") {
    users = users.filter((user) => user.status === status);
  }

  users.sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    const compared = left.localeCompare(right);
    return sortOrder === "asc" ? compared : -compared;
  });

  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = users.slice((page - 1) * pageSize, page * pageSize);

  return jsonData<Paginated<DbUser>>({
    items,
    page,
    pageSize,
    total,
    totalPages,
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, "users:create");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const body = await request.json().catch(() => null);
  const parsed = createUserFormSchema().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Invalid user data.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const db = getDb();
  const emailTaken = db.users.some(
    (user) => user.email.toLowerCase() === parsed.data.email.toLowerCase(),
  );
  if (emailTaken) {
    return jsonError(409, "EMAIL_TAKEN", "A user with this email already exists.");
  }

  const user: DbUser = {
    id: allocateUserId(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };
  db.users.unshift(user);

  return jsonData(user, { status: 201 });
}
