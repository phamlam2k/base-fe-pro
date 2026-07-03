import type { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError, requireAuth } from "@/lib/api/server";
import { createUserFormSchema } from "@/features/users/schemas";
import { getDb, simulateLatency } from "@/mocks/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "users:view");
  if ("response" in auth) return auth.response;

  await simulateLatency(200);

  const { id } = await params;
  const user = getDb().users.find((candidate) => candidate.id === id);
  if (!user) {
    return jsonError(404, "NOT_FOUND", "User not found.");
  }
  return jsonData(user);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "users:update");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const { id } = await params;
  const db = getDb();
  const user = db.users.find((candidate) => candidate.id === id);
  if (!user) {
    return jsonError(404, "NOT_FOUND", "User not found.");
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserFormSchema().partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Invalid user data.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  if (parsed.data.email) {
    const emailTaken = db.users.some(
      (candidate) =>
        candidate.id !== id &&
        candidate.email.toLowerCase() === parsed.data.email!.toLowerCase(),
    );
    if (emailTaken) {
      return jsonError(
        409,
        "EMAIL_TAKEN",
        "A user with this email already exists.",
      );
    }
  }

  Object.assign(user, parsed.data);
  return jsonData(user);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(request, "users:delete");
  if ("response" in auth) return auth.response;

  await simulateLatency();

  const { id } = await params;
  if (id === auth.user.id) {
    return jsonError(400, "CANNOT_DELETE_SELF", "You cannot delete your own account.");
  }

  const db = getDb();
  const index = db.users.findIndex((candidate) => candidate.id === id);
  if (index === -1) {
    return jsonError(404, "NOT_FOUND", "User not found.");
  }

  db.users.splice(index, 1);
  return jsonData(null);
}
