# Architecture Deep-Dive

Tài liệu này giải thích **tại sao** codebase được tổ chức như hiện tại và **cách mở rộng** nó. Đọc README.md trước để nắm tổng quan.

## 1. Triết lý: Feature-Sliced Design (FSD)

Codebase theo [Feature-Sliced Design](https://feature-sliced.design) — một chuẩn kiến trúc chia code theo **tầng (layer) → lát (slice) → phân đoạn (segment)**, enforce bằng linter chính thức [Steiger](https://github.com/feature-sliced/steiger) (`npm run fsd:lint`).

### Tầng (layers) — import CHỈ đi xuống

```
_app      → khởi tạo toàn cục (providers)              (app layer, đổi tên vì Next giữ app/)
_pages    → composition từng màn hình                   (pages layer, đổi tên vì Next giữ pages/)
widgets   → khối UI ghép, tự đủ (sidebar, org-console, dashboard-overview)
features  → một tương tác nghiệp vụ có state/mutation (manage-company, auth-by-credentials…)
entities  → một khái niệm nghiệp vụ (company, user, team… : model + api + ui hiển thị)
shared    → nền không gắn nghiệp vụ (ui kit, axios, utils, config)
```

Luật vàng (Steiger `fsd/forbidden-imports` enforce):

- Một slice chỉ import từ **tầng nằm dưới** nó. `widgets` dùng `features`/`entities`/`shared`; `features` dùng `entities`/`shared`; không có chiều ngược lại.
- **Slice cùng tầng KHÔNG import lẫn nhau** (`features/manage-team` không import `features/manage-user`). Nếu cần → thứ dùng chung thuộc tầng thấp hơn (đưa xuống `entities`/`shared`), hoặc gộp slice.
- `app` và `shared` là "layer kiêm slice" (không chia slice con); các tầng còn lại chia slice theo domain.
- Ngoài slice chỉ được import qua **public API** `index.ts` của slice.

### Thích ứng với Next.js

Next chiếm dụng `app/` và `pages/`. Theo hướng dẫn chính thức của FSD, hai tầng FSD đổi tên thành `_app` và `_pages`:

- `src/app/` — **chỉ là routing của Next**: `page.tsx` mỏng re-export từ `_pages`, cùng `app/api/**` route handlers. KHÔNG phải app-layer FSD.
  ```ts
  // src/app/(dashboard)/organization/page.tsx
  export { OrganizationPage as default, generateMetadata } from "@/_pages/organization";
  ```
- `src/_app/` — provider composition (FSD app layer).
- `src/_pages/<screen>/` — composition mỗi màn hình (metadata + PageHeader + widget/feature).

### Segment trong một slice

| Segment | Chứa gì |
|---|---|
| `model/` | types + zod schema + store (business logic) |
| `api/`   | request fn + **query-options factory** + mappers |
| `ui/`    | component hiển thị |
| `lib/` · `config/` | helper / hằng số riêng slice |
| `index.ts` | **public API** — chỉ export thứ cam kết ổn định |

### Anatomy của một entity (mẫu tham chiếu: `entities/company`)

```
entities/company/
├── model/company.ts          # Company, COMPANY_STATUSES, CompanyListParams, zod schemas
├── api/company.api.ts        # companyApi.list/create/update  (axios)
├── api/company.queries.ts    # companyQueries.all/lists/list   (query-options factory)
├── ui/company-status-badge.tsx
└── index.ts                  # public API
```

## 2. Data flow & react-query (query-options factory)

```
Server Component (_pages)              Client Component (widget/feature)
────────────────────────              ─────────────────────────────────
getTranslations() → title             useQuery(companyQueries.list(params))
                                         │
                                         ▼
                                      companyApi.list() ─axios→ /api/organization/companies
                                         │                        │ requireAuth()
                                         ▼                        ▼
                                      Paginated<Company> ←──── jsonData()
```

- **Server state** = TanStack Query. Không copy response vào useState/zustand.
- **Client state** (filter, dialog open…) = useState cục bộ; chỉ lên Zustand khi cần persist/global (ví dụ `features/theme/model/preferences-store`).
- **Form state** = react-hook-form + zod resolver.

**Query key/options factory** — một factory / entity, đặt ở `entities/<x>/api/<x>.queries.ts`:

```ts
export const companyQueries = {
  all:   () => ["company"] as const,
  lists: () => [...companyQueries.all(), "list"] as const,
  list:  (p: CompanyListParams) => queryOptions({
           queryKey: [...companyQueries.lists(), p],
           queryFn: () => companyApi.list(p), placeholderData: keepPreviousData }),
};
```

Reads gọi thẳng `useQuery(companyQueries.list(p))`. **Mutations sống ở features** (`manage-company/model/hooks.ts` → `useCreateCompany`) và invalidate ở mức cao nhất hợp lý: `companyQueries.all()`. Hai slice không tự chế key riêng cho cùng resource — cache react-query là một cây chung.

## 3. Auth & session

Mock JWT = base64url(JSON payload) trong httpOnly cookie `base_fe_session`.

```
LoginForm ─POST /api/auth/login→ set-cookie ─router.refresh()→
  proxy.ts decode cookie (mọi navigation)
  (dashboard)/layout.tsx getCurrentUser() → <SessionProvider user>
      → useSession() / usePermission() ở mọi client component, không fetch thêm
```

Ba lớp enforcement (không bỏ lớp nào):

| Lớp | File | Chặn gì |
|---|---|---|
| Proxy | `src/proxy.ts` + `shared/config/routes.ts` | Điều hướng: login-redirect, /403 |
| API | `shared/api/server.ts` `requireAuth(req, permission)` | Dữ liệu: 401/403 |
| UI | `entities/session` `PermissionGate` / `usePermission` | Trải nghiệm: ẩn nút không dùng được |

`SessionProvider`, `useSession`, `usePermission`, `PermissionGate` sống ở **`entities/session`**. Codec token (server-only) ở `shared/lib/auth/token.ts`. Khi tích hợp backend thật: thay `encode/decodeSessionToken` bằng verify JWT (`jose`), giữ nguyên interface `SessionTokenPayload`.

## 4. Theming

Ba trục độc lập, đều là CSS variables trên `<html>`:

| Trục | Cơ chế | Nơi định nghĩa |
|---|---|---|
| Dark/Light | class `dark` (next-themes) | `shared/config/.../globals.css` `:root` / `.dark` |
| Màu chủ đạo | `data-preset="blue"…` | override `--primary`, `--ring`, `--chart-*` |
| Bo góc | `data-radius="none\|sm\|md\|xl"` | override `--radius` |
| Mật độ | `data-density="compact\|spacious"` | override `--spacing` (Tailwind v4 scale mọi padding/gap) |

State + persist + UI: **`features/theme`** (`model/preferences-store.ts` + `ui/theme-customizer.tsx` + `ui/theme-toggle.tsx`). Chống FOUC: inline script trong `app/layout.tsx` (phải sync key/defaults với store).

## 5. i18n

- `next-intl` chế độ **without i18n routing**: locale từ cookie `NEXT_LOCALE` (`shared/config/i18n/request.ts`), đổi bằng server action + `router.refresh()`.
- Messages theo namespace; thêm key mới **bắt buộc thêm cả `en.json` lẫn `vi.json`** (`shared/config/i18n/messages/`).
- Zod messages: schema factory `createXSchema(t?)` — client truyền `useTranslations("<ns>")`, server (route handler) gọi trần → English fallback.

## 6. Mock API

**Route Handlers** thay vì MSW: chạy thật qua network tab, dùng cho cả SSR lẫn client, và là chỗ demo `requireAuth`. DB in-memory seed deterministic (`src/mocks/`), cache trên `globalThis` để sống qua HMR.

Envelope chuẩn (áp cho cả backend thật):

```jsonc
{ "data": ... }                                              // 2xx
{ "error": { "code": "EMAIL_TAKEN", "message": "...", "details": { "field": ["msg"] } } }  // 4xx/5xx
```

`shared/api/axios.ts` chuẩn hóa mọi lỗi thành `ApiError { status, code, message, details }` và tự redirect khi 401 (trừ request login). Route handlers import contract (schemas/types) **thẳng từ entities**.

## 7. Checklist thêm một feature/màn hình mới

Ví dụ: thêm quản lý "Hợp đồng" (contract).

1. **entity** `entities/contract/`: `model/contract.ts` (types + zod), `api/contract.api.ts` (axios), `api/contract.queries.ts` (query factory), `ui/…` (badge…), `index.ts`.
2. **feature(s)** `features/manage-contract/`: `ui/contract-form-dialog.tsx` + `model/hooks.ts` (mutation gọi `contractApi`, invalidate `contractQueries.all()`), `index.ts`.
3. **widget** (nếu là khối màn hình ghép) `widgets/…` hoặc dựng thẳng trong `_pages`.
4. **page** `_pages/contracts/`: `ui/contracts-page.tsx` (metadata + PageHeader + widget/feature) + `index.ts`.
5. **route** `app/(dashboard)/contracts/page.tsx`: `export { ContractsPage as default, generateMetadata } from "@/_pages/contracts";`
6. `shared/config/nav.ts` — nav item (+ permission nếu cần); `shared/config/permissions.ts` + `routes.ts` nếu cần quyền/route bảo vệ.
7. `shared/config/i18n/messages/{en,vi}.json` — namespace mới.
8. Mock: `app/api/contracts/route.ts` + seed `src/mocks/` (import schema từ entity).
9. **Test cùng PR** (xem `docs/TESTING.md`).
10. `npm run typecheck && npm run lint && npm run fsd:lint && npm run build` xanh.

## 8. Các hệ thống riêng của bản Pro

- **Env validation** (`src/env.ts`): import `env` thay vì `process.env`.
- **Feature flags** (`shared/config/feature-flags.ts`): consumer đi qua `isFeatureEnabled` / `<FeatureGate>`.
- **URL-synced filters** (`shared/lib/use-url-synced-state.ts`): state là source of truth, URL là mirror.
- **RBAC**: nguồn sự thật `shared/config/permissions.ts`; ba lớp ở §3.
- **Testing**: quy ước ở `docs/TESTING.md`; hạ tầng `src/test/` (custom render, factories, MSW).

## 9. Enforcement kiến trúc: Steiger

`npm run fsd:lint` chạy Steiger với ruleset khuyến nghị. Rule **load-bearing** là `fsd/forbidden-imports` (thứ tự tầng + cấm cross-import cùng tầng) — luôn bật.

`steiger.config.ts` tắt vài rule không hợp codebase này, **có ghi lý do**:

| Rule tắt | Lý do |
|---|---|
| `fsd/typo-in-layer-name` | `_app`/`_pages` là chuẩn FSD-Next chính thức (Next giữ `app`/`pages`) |
| `fsd/no-public-api-sidestep` + `fsd/public-api` (scope `shared`) | `shared` phát hành public API **theo từng module** (`@/shared/ui/button`) — chuẩn shadcn, không barrel |
| `fsd/insignificant-slice` | Phân rã FSD đầy đủ là chủ đích; slice một consumer là bề mặt mở rộng |
| `fsd/no-segmentless-slices` (scope `_app`) | app layer vốn slice-less |

> Lịch sử: trước đây ranh giới feature enforce bằng rule `no-restricted-imports` tự chế trong ESLint (đọc `src/features`). Đã gỡ ở P0 của migration — Steiger thay thế toàn bộ.

## 10. Decision log

| Quyết định | Lý do | Xem lại khi |
|---|---|---|
| **Refactor sang FSD** (từ bulletproof-react) | Ranh giới slice/segment rõ + linter chính thức enforce; `organization` cũ phình 22 file | — |
| Query-options factory ở entity, mutation ở feature | Cache là cây chung; tách read/write theo tầng | — |
| `_app`/`_pages` prefix | Next giữ `app`/`pages`; hướng dẫn FSD-Next chính thức | Next đổi routing convention |
| Cookie-based i18n (không prefix URL) | Dashboard không cần SEO | Cần landing đa ngôn ngữ |
| Mock bằng Route Handlers (không MSW) | Chạy cả SSR, thấy trong network tab, demo auth | Cần mock trong unit test |
| Session qua server layout + Context | 0 request thừa, có sẵn lúc first paint | Cần refresh session real-time |
| Mock token base64 (không JWT lib) | Không cần crypto cho mock; interface giữ nguyên | Tích hợp backend → `jose` |
