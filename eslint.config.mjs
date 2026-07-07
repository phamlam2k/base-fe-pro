import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint = code style / correctness only.
 *
 * Architecture boundaries (FSD layer/slice/public-API rules) are enforced by
 * Steiger (`npm run fsd:lint`), the official Feature-Sliced Design linter —
 * see steiger.config.ts. The previous feature-boundary `no-restricted-imports`
 * rule (which read ./src/features) was removed with the FSD migration.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
