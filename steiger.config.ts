import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

/**
 * Feature-Sliced Design architecture linting (official FSD linter).
 * Run with `npm run fsd:lint`.
 *
 * Ignored:
 *  - src/app  → Next.js routing dir (thin re-exports), NOT an FSD layer.
 *  - tests / test infra.
 */
export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: [
      "./src/app/**",
      "./src/test/**",
      "./src/**/*.test.{ts,tsx}",
      "./src/proxy.ts",
      "./src/env.ts",
    ],
  },
]);
