import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests cover the critical user journeys only (auth, RBAC, core CRUD).
 * Everything else belongs in Vitest — see docs/TESTING.md.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // mock API is a shared in-memory DB — keep runs deterministic
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
