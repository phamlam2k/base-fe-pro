import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "Demo@123";

export const ACCOUNTS = {
  admin: "admin@acme.io",
  manager: "manager@acme.io",
  viewer: "viewer@acme.io",
} as const;

/** Sign in through the real login form and wait for the dashboard. */
export async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
