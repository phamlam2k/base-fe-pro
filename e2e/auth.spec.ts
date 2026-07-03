import { expect, test } from "@playwright/test";

import { ACCOUNTS, DEMO_PASSWORD, login } from "./helpers";

test.describe("authentication", () => {
  test("redirects anonymous visitors from a protected page to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });

  test("rejects invalid credentials with a visible error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ACCOUNTS.admin);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in, lands on the dashboard, then signs out", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    // Sign out through the user menu.
    await page.getByRole("button", { name: "AA" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Session is really gone: protected page redirects again.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("honors the redirect param after login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

    await page.getByLabel("Email").fill(ACCOUNTS.admin);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/orders/);
  });
});
