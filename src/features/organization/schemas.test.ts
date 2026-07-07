import { describe, expect, it } from "vitest";

import {
  companyListQuerySchema,
  createMemberFormSchema,
  createTeamFormSchema,
  memberListQuerySchema,
} from "@/features/organization/schemas";

describe("createMemberFormSchema", () => {
  const schema = createMemberFormSchema();
  const valid = {
    name: "Nguyễn Văn A",
    email: "a@congty.vn",
    role: "COMPANY_ADMIN",
    customTitle: "Tổng Giám đốc",
  };

  it("accepts a valid member", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["name", { name: "A" }],
    ["email", { email: "not-an-email" }],
    ["role", { role: "SUPER_ADMIN" }],
  ])("rejects invalid %s", (field, override) => {
    const result = schema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain(field);
    }
  });

  it("uses the provided translator for messages", () => {
    const t = (key: string) => `translated:${key}`;
    const result = createMemberFormSchema(t).safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("translated:validation.nameMin");
    }
  });
});

describe("createTeamFormSchema (team-tree rule)", () => {
  const schema = createTeamFormSchema();

  it("accepts a Supervision root with no parent", () => {
    expect(
      schema.safeParse({ name: "TVGS 1", teamType: "SUPERVISION", parentTeamId: null })
        .success,
    ).toBe(true);
  });

  it("rejects a Supervision team that has a parent", () => {
    expect(
      schema.safeParse({ name: "TVGS 1", teamType: "SUPERVISION", parentTeamId: "tea_1" })
        .success,
    ).toBe(false);
  });

  it("rejects a Contractor without a parent", () => {
    const result = schema.safeParse({
      name: "Nhà thầu A",
      teamType: "CONTRACTOR",
      parentTeamId: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("parentTeamId");
    }
  });

  it("accepts a Contractor attached to a parent", () => {
    expect(
      schema.safeParse({
        name: "Nhà thầu A",
        teamType: "CONTRACTOR",
        parentTeamId: "tea_1",
      }).success,
    ).toBe(true);
  });
});

describe("query schemas", () => {
  it("applies defaults for the company list", () => {
    expect(companyListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("requires a companyId for the member list", () => {
    expect(memberListQuerySchema.safeParse({}).success).toBe(false);
    expect(memberListQuerySchema.safeParse({ companyId: "com_1" }).success).toBe(true);
  });
});
