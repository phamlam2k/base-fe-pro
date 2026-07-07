"use client";

import * as React from "react";

import type { Permission } from "@/shared/config/permissions";
import { usePermission } from "@/entities/session/model/session-context";

/**
 * Renders children only when the current user has the permission(s).
 *
 *   <PermissionGate permission="users:delete">
 *     <DeleteButton />
 *   </PermissionGate>
 *
 * UI gating only — the API and proxy enforce the same rules server-side.
 */
export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: Permission;
  /** Pass when any one of several permissions suffices. */
  anyOf?: readonly Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can, canAny } = usePermission();

  const allowed =
    (permission ? can(permission) : true) && (anyOf ? canAny(anyOf) : true);

  return <>{allowed ? children : fallback}</>;
}
