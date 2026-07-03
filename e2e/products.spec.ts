import { expect, test } from "@playwright/test";

import { ACCOUNTS, login } from "./helpers";

test.describe("products CRUD journey", () => {
  test("admin creates a product, sees it listed, then deletes it", async ({
    page,
  }) => {
    // Unique name/SKU so retries never collide with leftover data.
    const suffix = `${Date.now()}`.slice(-6);
    const name = `E2E Widget ${suffix}`;
    const sku = `E2E-${suffix}`;

    await login(page, ACCOUNTS.admin);
    await page.goto("/products");

    // Create
    await page.getByRole("button", { name: "Add product" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("SKU").fill(sku);
    await dialog.getByLabel("Price").fill("49.99");
    await dialog.getByLabel("Stock").fill("10");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("Product created successfully")).toBeVisible();

    // New product appears (newest first by default sort).
    await expect(page.getByText(name)).toBeVisible();

    // Delete (optimistic) — row disappears immediately.
    await page
      .getByRole("row", { name: new RegExp(name) })
      .getByRole("button", { name: "Open menu" })
      .click();
    await page.getByRole("menuitem", { name: "Delete product" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Confirm" })
      .click();

    await expect(page.getByText("Product deleted successfully")).toBeVisible();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("filters synchronize to the URL and survive a reload", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto("/products");

    await page.getByPlaceholder("Search by name or SKU...").fill("aurora");
    await expect(page).toHaveURL(/q=aurora/);

    await page.reload();
    await expect(page.getByPlaceholder("Search by name or SKU...")).toHaveValue(
      "aurora",
    );
  });

  test("validation blocks an invalid product form", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await page.goto("/products");

    await page.getByRole("button", { name: "Add product" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("X");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(
      dialog.getByText("Name must be at least 2 characters"),
    ).toBeVisible();
    await expect(
      dialog.getByText("SKU: letters, digits and dashes, min 3 chars"),
    ).toBeVisible();
  });
});
