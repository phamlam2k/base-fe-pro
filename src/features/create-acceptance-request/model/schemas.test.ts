import { describe, expect, it } from "vitest";

import { toDatetimeLocalVN } from "@/shared/lib/format-date";

import { createAcceptanceRequestSchema } from "./schemas";

const HOUR = 60 * 60 * 1000;
const base = {
  type: "material" as const,
  contractorTeam: "t1",
  materialType: "Xi măng",
  quantity: "10 tấn",
};
const at = (hoursFromNow: number) => toDatetimeLocalVN(new Date(Date.now() + hoursFromNow * HOUR));

describe("proposedAt tối thiểu 24h", () => {
  const schema = createAcceptanceRequestSchema();

  it("chặn giờ < 24h tới", () => {
    const r = schema.safeParse({ ...base, proposedAt: at(23) });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["proposedAt"]);
  });

  it("cho giờ ≥ 24h tới hoặc bỏ trống", () => {
    expect(schema.safeParse({ ...base, proposedAt: at(25) }).success).toBe(true);
    expect(schema.safeParse({ ...base, proposedAt: "" }).success).toBe(true);
  });

  it("sửa & gửi lại giữ nguyên giờ cũ thì không kiểm", () => {
    const old = at(2);
    expect(createAcceptanceRequestSchema(undefined, old).safeParse({ ...base, proposedAt: old }).success).toBe(true);
  });
});
