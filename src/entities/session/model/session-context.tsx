"use client";

import * as React from "react";

import {
  can,
  canAny,
  type Permission,
  type Role,
} from "@/shared/config/permissions";

/** Client-side mirror of the server session (see shared/lib/auth/session.ts). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Vai trò nghiệp vụ Madoka (TVGS/NT/PTN/CĐT/Admin) — gating màn nghiệp vụ. */
  madokaRole?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  idNumber?: string | null;
  address?: string | null;
}

interface SessionContextValue {
  user: SessionUser;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

/**
 * Receives the user resolved server-side in the protected layout, making it
 * available to any client component without an extra fetch.
 */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ user }), [user]);
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within <SessionProvider>");
  }
  return context;
}

/** Permission checks bound to the current user. */
export function usePermission() {
  const { user } = useSession();
  return React.useMemo(
    () => ({
      role: user.role,
      can: (permission: Permission) => can(user.role, permission),
      canAny: (permissions: readonly Permission[]) =>
        canAny(user.role, permissions),
    }),
    [user.role],
  );
}
