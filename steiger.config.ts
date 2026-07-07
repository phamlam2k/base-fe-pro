import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

/**
 * Feature-Sliced Design architecture linting (official FSD linter).
 * Run with `npm run fsd:lint`.
 *
 * The recommended ruleset is on; a few rules are tuned for this codebase with
 * the rationale inline. The load-bearing rule — `fsd/forbidden-imports` (layer
 * ordering + no same-layer cross-imports) — stays ON.
 */
export default defineConfig([
  ...fsd.configs.recommended,

  {
    rules: {
      // `_app` / `_pages` are the official FSD + Next.js adaptation (Next
      // reserves `app/` and `pages/`). This steiger version reads the leading
      // underscore as a typo of the canonical layer names.
      "fsd/typo-in-layer-name": "off",

      // The `shared` layer exposes a public API PER MODULE, not one barrel:
      // `@/shared/ui/button`, `@/shared/lib/utils`, `@/shared/api/axios` are
      // the intended entry points (shadcn/ui convention). Barrelling 30+ ui
      // primitives would hurt tree-shaking and fight the generator.
      "fsd/no-public-api-sidestep": "off",

      // Full-FSD decomposition is deliberate (migration decision #2): one
      // manage-* feature per interaction, one widget per screen block. Many
      // legitimately have a single current consumer — that's extensibility
      // surface, not an accident.
      "fsd/insignificant-slice": "off",
    },
  },

  {
    // Consistent with per-module public APIs above: shared segments are not
    // required to publish a single index.
    files: ["./src/shared/**"],
    rules: { "fsd/public-api": "off" },
  },

  {
    // The app layer is slice-less (segments live directly under it); the `_app`
    // prefix makes this steiger version model `_app/providers` as a segmentless
    // slice.
    files: ["./src/_app/**"],
    rules: { "fsd/no-segmentless-slices": "off" },
  },

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
