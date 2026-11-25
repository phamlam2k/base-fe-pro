import { describe, expect, it } from "vitest";

import { companyListQuerySchema } from "@/entities/company";
import {
  createMemberFormSchema,
  memberListQuerySchema,
} from "@/entities/company-member";
import {
  createTeamFormSchema,
  parsePlacementKey,
  placementOptions,
  type Team,
} from "@/entities/team";

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

  it("accepts a Package root with no parent", () => {
    expect(
      schema.safeParse({ name: "Gói thầu 1", teamType: "PACKAGE", placementKeys: [] })
        .success,
    ).toBe(true);
  });

  it("rejects a Package that has a parent", () => {
    expect(
      schema.safeParse({ name: "Gói thầu 1", teamType: "PACKAGE", placementKeys: ["tea_1|pkg_1"] })
        .success,
    ).toBe(false);
  });

  it("rejects a Supervision team without a parent package", () => {
    expect(
      schema.safeParse({ name: "TVGS 1", teamType: "SUPERVISION", placementKeys: [] })
        .success,
    ).toBe(false);
  });

  it("accepts a Supervision team attached to a package", () => {
    expect(
      schema.safeParse({ name: "TVGS 1", teamType: "SUPERVISION", placementKeys: ["pkg_1|pkg_1"] })
        .success,
    ).toBe(true);
  });

  it("rejects a Contractor without a parent", () => {
    const result = schema.safeParse({
      name: "Nhà thầu A",
      teamType: "CONTRACTOR",
      placementKeys: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("placementKeys");
    }
  });

  it("accepts a Contractor attached to a parent", () => {
    expect(
      schema.safeParse({
        name: "Nhà thầu A",
        teamType: "CONTRACTOR",
        placementKeys: ["tea_1|pkg_1"],
      }).success,
    ).toBe(true);
  });

  it("accepts a Contractor under several TVGS · contract placements", () => {
    expect(
      schema.safeParse({
        name: "SJC",
        teamType: "CONTRACTOR",
        placementKeys: ["tvgs_texo|hd_2012", "tvgs_texo|hd_2810"],
      }).success,
    ).toBe(true);
  });
});

describe("placementOptions / parsePlacementKey", () => {
  const base = { projectId: "p", memberCount: 0, createdAt: "" };
  const teams: Team[] = [
    { ...base, id: "hd1", name: "HĐ 1", teamType: "PACKAGE", parentTeamId: null, placements: [] },
    { ...base, id: "hd2", name: "HĐ 2", teamType: "PACKAGE", parentTeamId: null, placements: [] },
    {
      ...base, id: "texo", name: "TEXO", teamType: "SUPERVISION", parentTeamId: "hd1",
      placements: [
        { id: "l1", parentId: "hd1", parentName: "HĐ 1", packageId: "hd1", packageName: "HĐ 1" },
        { id: "l2", parentId: "hd2", parentName: "HĐ 2", packageId: "hd2", packageName: "HĐ 2" },
      ],
    },
  ];

  it("lists contracts for a Supervision team", () => {
    expect(placementOptions("SUPERVISION", teams).map((o) => o.label)).toEqual(["HĐ 1", "HĐ 2"]);
  });

  it("lists one option per TVGS · contract for a Contractor", () => {
    expect(placementOptions("CONTRACTOR", teams)).toEqual([
      { key: "texo|hd1", label: "TEXO · HĐ 1" },
      { key: "texo|hd2", label: "TEXO · HĐ 2" },
    ]);
    expect(parsePlacementKey("texo|hd2")).toEqual({ parentTeam: "texo", package: "hd2" });
    expect(parsePlacementKey("texo|")).toEqual({ parentTeam: "texo", package: null });
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
