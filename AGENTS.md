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
npm run lint           # ESLint (code-style)
npm run fsd:lint       # Steiger — Feature-Sliced Design architecture linter
npm run test           # Vitest unit + integration
npm run test:e2e       # Playwright (needs: npx playwright install chromium)
npm run build          # production build
```

## Architecture: Feature-Sliced Design (FSD)

The codebase follows **FSD**, enforced by **Steiger** (`npm run fsd:lint`). Full rules in `docs/ARCHITECTURE.md`. Layers, import DOWNWARD only:

```
_app → _pages → widgets → features → entities → shared
```

`_app`/`_pages` are the FSD app/pages layers renamed because Next reserves `app/`+`pages/`. `src/app/` is Next routing only: `page.tsx` files thin-re-export from `_pages`, plus `app/api/**` handlers.

## Hard rules (enforced or load-bearing)

- **Layer boundaries** (Steiger `fsd/forbidden-imports`): a slice imports only from LOWER layers, and **never from another slice on its own layer** (`features/manage-team` must not import `features/manage-user`). Shared code goes to a lower layer or the slices merge. Cross-slice imports go through the target's `index.ts` public API — no deep imports into internals.
- **Pages are route adapters**: `app/**/page.tsx` is a one-line re-export (`export { XPage as default, generateMetadata } from "@/_pages/x"`). Screen composition lives in `_pages/<x>/ui/*-page.tsx`; interactive blocks in `widgets/*` or `features/*`.
- **react-query factory**: reads use the entity's query-options factory (`entities/<x>/api/<x>.queries.ts` → `xQueries.list(...)`) via `useQuery` directly. Mutations live in a `manage-*` feature's `model/hooks.ts` and invalidate `xQueries.all()`. Never write inline query keys.
- **RBAC has 3 layers** — keep in sync when adding a permission: `src/proxy.ts` + `shared/config/routes.ts` (routing), `requireAuth()` in route handlers (API), `PermissionGate`/`usePermission()` from `entities/session` (UI). Source of truth: `shared/config/permissions.ts`.
- **i18n**: every user-visible string goes through next-intl. A new key requires BOTH `shared/config/i18n/messages/en.json` and `vi.json`. Validation messages use `createXSchema(t?)`.
- **No hardcoding**: paths → `shared/config/routes.ts`; env vars → `src/env.ts` (zod-validated, never raw `process.env`); flags → `shared/config/feature-flags.ts`.
- **`src/shared/ui/**` is generated shadcn code** — do not hand-edit except for documented reasons. Import it per-module (`@/shared/ui/button`), not via a barrel.

## Definition of done for a change

1. `npm run typecheck && npm run lint && npm run fsd:lint && npm run build` all pass (+ `npm run test` when the runner is available).
2. New slices expose a public `index.ts`; new pure logic (model/schema) has colocated unit tests; a new screen has one integration test (MSW at the network boundary — do not mock modules/hooks).
3. New strings exist in both locale files; new routes registered in `shared/config/routes.ts` (+ `ROUTE_PERMISSIONS` if protected) and `shared/config/nav.ts` if navigable.
4. Mock API updated (`src/app/api/**`, seed in `src/mocks/`) if the contract changed.
