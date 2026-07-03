import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost:3000" },
    },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Unit/integration tests are colocated with source; E2E lives in /e2e (Playwright).
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**"],
      exclude: [
        "src/components/ui/**", // generated shadcn components
        "src/app/**",           // thin route files — covered by E2E
        "src/mocks/**",         // mock API data
        "src/test/**",
        "src/messages/**",
        "src/**/*.test.{ts,tsx}",
      ],
    },
  },
});
