import { describe, expect, it } from "vitest";

import { PermissionGate } from "@/entities/session";
import { buildSessionUser } from "@/test/factories";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("<PermissionGate />", () => {
  it("renders children when the user has the permission", () => {
    renderWithProviders(
      <PermissionGate permission="users:delete">
        <button>Delete</button>
      </PermissionGate>,
      { sessionUser: buildSessionUser({ role: "admin" }) },
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders the fallback when the permission is missing", () => {
    renderWithProviders(
      <PermissionGate permission="users:delete" fallback={<span>read only</span>}>
        <button>Delete</button>
      </PermissionGate>,
      { sessionUser: buildSessionUser({ role: "viewer" }) },
    );
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByText("read only")).toBeInTheDocument();
  });

  it("anyOf passes when at least one permission matches", () => {
    renderWithProviders(
      <PermissionGate anyOf={["users:delete", "dashboard:view"]}>
        <span>visible</span>
      </PermissionGate>,
      { sessionUser: buildSessionUser({ role: "viewer" }) },
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });
});
