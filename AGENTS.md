<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Known differences from older Next.js: `src/proxy.ts` replaces `middleware.ts`; `cookies()`/`headers()`/`params`/`searchParams` are async; Turbopack is the default bundler; `next lint` was removed (use `npm run lint`).

# Project guide (base-fe-pro)

Advanced Next.js boilerplate: RBAC, theming, i18n, mock API, full testing setup. Read `README.md` for the overview, `docs/ARCHITECTURE.md` for the architecture rules, `docs/TESTING.md` for testing conventions.

## Commands

```bash
npm run dev            # dev server (login: admin@acme.io / Demo@123)
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint (includes feature-boundary rules)
npm run test           # Vitest unit + integration
npm run test:e2e       # Playwright (needs: npx playwright install chromium)
npm run build          # production build
```

## Hard rules (enforced or load-bearing)

- **Feature boundaries** (ESLint-enforced): code outside a feature imports it only via `@/features/<name>` (its `index.ts` public API) or contract modules `types`/`schemas`/`lib`. Never deep-import feature internals. Cross-feature dependencies flow one way: composite (orders, dashboard, notifications) → core (auth, users, products). See `docs/ARCHITECTURE.md` §9.
- **Pages are route adapters**: `app/**/page.tsx` holds metadata, params parsing, server-side auth and feature composition only. Interactive screens live in `features/<name>/components/*-view.tsx` (client components).
- **RBAC has 3 layers** — keep all of them in sync when adding a permission: `src/proxy.ts` + `config/routes.ts` (routing), `requireAuth()` in route handlers (API), `<PermissionGate>`/`usePermission()` (UI). Source of truth: `src/config/permissions.ts`.
- **i18n**: every user-visible string goes through next-intl. Adding a message key requires BOTH `src/messages/en.json` and `src/messages/vi.json`. Validation messages use the schema-factory pattern (`createXSchema(t?)`).
- **No hardcoding**: paths → `config/routes.ts`; env vars → `src/env.ts` (zod-validated, never raw `process.env`); flags → `config/feature-flags.ts`.
- **`src/components/ui/**` is generated shadcn code** — do not hand-edit except for documented reasons.
- **Query keys** come from each feature's key factory (`userKeys`, `productKeys`...) — never write inline query keys.

## Definition of done for a change

1. `npm run typecheck && npm run lint && npm run test` all pass.
2. New pure logic (lib/schema) has colocated unit tests; a new screen has one integration test (MSW at the network boundary — do not mock modules/hooks).
3. New strings exist in both locale files; new routes registered in `config/routes.ts` (+ `ROUTE_PERMISSIONS` if protected) and `config/nav.ts` if navigable.
4. Mock API updated (`src/app/api/**`, seed in `src/mocks/`) if the contract changed.
