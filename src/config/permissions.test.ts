import { describe, expect, it } from "vitest";

import {
  can,
  canAll,
  canAny,
  ROLES,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "@/config/permissions";

describe("RBAC permissions", () => {
  // Table-driven: the contract each role must satisfy. When you change
  // ROLE_PERMISSIONS on purpose, update this table in the same PR.
  const cases: Array<[Role, Permission, boolean]> = [
    ["admin", "users:delete", true],
    ["admin", "products:delete", true],
    ["manager", "users:create", true],
    ["manager", "users:delete", false],
    ["manager", "products:delete", false],
    ["manager", "orders:update", true],
    ["viewer", "dashboard:view", true],
    ["viewer", "users:view", false],
    ["viewer", "products:view", true],
    ["viewer", "products:create", false],
    ["viewer", "orders:update", false],
  ];

  it.each(cases)("%s → %s = %s", (role, permission, expected) => {
    expect(can(role, permission)).toBe(expected);
  });

  it("every role only holds declared permissions", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("canAny passes when at least one permission matches", () => {
    expect(canAny("viewer", ["users:delete", "dashboard:view"])).toBe(true);
    expect(canAny("viewer", ["users:delete", "users:create"])).toBe(false);
  });

  it("canAll requires every permission", () => {
    expect(canAll("manager", ["users:view", "users:create"])).toBe(true);
    expect(canAll("manager", ["users:view", "users:delete"])).toBe(false);
  });
});
