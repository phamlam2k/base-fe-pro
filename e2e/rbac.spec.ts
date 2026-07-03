import { expect, test } from "@playwright/test";

import { ACCOUNTS, login } from "./helpers";

test.describe("role-based access control", () => {
  test("viewer cannot reach /users — proxy redirects to /403", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.viewer);

    await page.goto("/users");
    await expect(page).toHaveURL(/\/403/);
    await expect(page.getByText("Access denied")).toBeVisible();
  });

  test("viewer does not see the Users nav item but does see Products", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.viewer);

    await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  });

  test("viewer sees products read-only (no add button, no row selection)", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.viewer);

    await page.goto("/products");
    await expect(
      page.getByRole("heading", { name: "Products" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add product" }),
    ).toHaveCount(0);
  });

  test("manager can create users but sees no delete action", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.manager);

    await page.goto("/users");
    await expect(page.getByRole("button", { name: "Add user" })).toBeVisible();

    // Open the first row menu: edit is offered, delete is not.
    await page.getByRole("button", { name: "Open menu" }).first().click();
    await expect(page.getByRole("menuitem", { name: "Edit user" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Delete user" })).toHaveCount(0);
  });
});
