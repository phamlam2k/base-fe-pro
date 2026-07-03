import { describe, expect, it } from "vitest";

import { canTransition, isTerminal, nextStatuses } from "@/features/orders/lib";
import { ORDER_STATUSES } from "@/features/orders/types";

describe("order status state machine", () => {
  it("follows the happy path pending → processing → shipped → delivered", () => {
    expect(canTransition("pending", "processing")).toBe(true);
    expect(canTransition("processing", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
  });

  it("allows cancellation only before shipping", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("processing", "cancelled")).toBe(true);
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  it("rejects skipping steps and moving backwards", () => {
    expect(canTransition("pending", "shipped")).toBe(false);
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("shipped", "processing")).toBe(false);
    expect(canTransition("delivered", "pending")).toBe(false);
  });

  it("treats delivered and cancelled as terminal", () => {
    expect(isTerminal("delivered")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
  });

  it("never allows a self-transition", () => {
    for (const status of ORDER_STATUSES) {
      expect(nextStatuses(status)).not.toContain(status);
    }
  });
});
