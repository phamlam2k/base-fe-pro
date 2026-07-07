import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@/shared/config/routes";
import { LoginForm } from "@/features/auth-by-credentials/ui/login-form";
import { mockRouter } from "@/test/mocks/navigation";
import { server } from "@/test/msw/server";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

describe("<LoginForm />", () => {
  it("shows validation errors and does not call the API on an empty submit", async () => {
    const { user } = renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("surfaces the server error message on invalid credentials", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@acme.io");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard after a successful login", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({
          data: { id: "usr_001", email: "admin@acme.io", name: "Ada Admin", role: "admin" },
        }),
      ),
    );
    const { user } = renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@acme.io");
    await user.type(screen.getByLabelText("Password"), "Demo@123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(ROUTES.dashboard),
    );
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("fills the form when a demo account shortcut is clicked", async () => {
    const { user } = renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "manager@acme.io" }));

    expect(screen.getByLabelText("Email")).toHaveValue("manager@acme.io");
    expect(screen.getByLabelText("Password")).toHaveValue("Demo@123");
  });
});
