import fs from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Feature-boundary enforcement (see docs/ARCHITECTURE.md §9).
 *
 * Rule: code OUTSIDE a feature may import it only through:
 *   - its public API  ........ "@/features/<name>"  (index.ts)
 *   - its contract modules ... "@/features/<name>/(types|schemas|lib)"
 *     (pure, dependency-free — safely importable from route handlers/proxy)
 * Deep imports into components/hooks/api internals are blocked, so features
 * stay refactorable without breaking the rest of the app.
 */
const FEATURES = fs.readdirSync("./src/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const CONTRACT_EXCEPTIONS = [
  "!@/features/*/types",
  "!@/features/*/schemas",
  "!@/features/*/lib",
];

const boundaryRule = (ownFeature) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/features/*/**",
            ...(ownFeature ? [`!@/features/${ownFeature}/**`] : []),
            ...CONTRACT_EXCEPTIONS,
          ],
          message:
            "Import features via their public API '@/features/<name>' (or contract modules types/schemas/lib). See docs/ARCHITECTURE.md §9.",
        },
      ],
    },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Everyone outside a feature: public API + contract modules only.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: boundaryRule(null),
  },
  // Inside a feature: free access to its OWN internals, others still gated.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: boundaryRule(feature),
  })),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
