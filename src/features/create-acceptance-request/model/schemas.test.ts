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

describe("proposedAt không ở quá khứ", () => {
  const schema = createAcceptanceRequestSchema();

  it("chặn giờ ở quá khứ", () => {
    const r = schema.safeParse({ ...base, proposedAt: at(-1) });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["proposedAt"]);
  });

  it("cho giờ sắp tới (không cần 24h) hoặc bỏ trống", () => {
    expect(schema.safeParse({ ...base, proposedAt: at(1) }).success).toBe(true);
    expect(schema.safeParse({ ...base, proposedAt: "" }).success).toBe(true);
  });

  it("sửa & gửi lại giữ nguyên giờ cũ thì không kiểm", () => {
    const old = at(-2);
    expect(createAcceptanceRequestSchema(undefined, old).safeParse({ ...base, proposedAt: old }).success).toBe(true);
  });
});
