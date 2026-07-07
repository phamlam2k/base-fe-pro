import { describe, expect, it } from "vitest";

import {
  can,
  canAll,
  canAny,
  ROLES,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "@/shared/config/permissions";

describe("RBAC permissions", () => {
  // Table-driven: the contract each role must satisfy. When you change
  // ROLE_PERMISSIONS on purpose, update this table in the same PR.
  const cases: Array<[Role, Permission, boolean]> = [
    ["admin", "users:delete", true],
    ["admin", "orgs:manage", true],
    ["manager", "orgs:view", true],
    ["manager", "orgs:manage", true],
    ["manager", "users:create", false],
    ["manager", "users:delete", false],
    ["viewer", "dashboard:view", true],
    ["viewer", "settings:view", true],
    ["viewer", "users:view", false],
    ["viewer", "orgs:view", false],
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
    expect(canAll("manager", ["orgs:view", "orgs:manage"])).toBe(true);
    expect(canAll("manager", ["orgs:view", "users:delete"])).toBe(false);
  });
});
