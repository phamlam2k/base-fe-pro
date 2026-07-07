# Base FE Pro — Advanced Next.js Boilerplate

Bản nâng cao của `base-fe`: nhiều feature phức tạp hơn và **bộ test đầy đủ theo chuẩn công ty product lớn**. Thiết kế để team ~10 người làm việc song song mà không dẫm chân nhau.

**Có gì thêm so với base-fe:**

- **Products** — bulk selection + bulk delete, filter đồng bộ lên URL (share được link), optimistic delete (rollback khi lỗi), export CSV, ẩn/hiện cột.
- **Orders** — trang chi tiết `/orders/[id]` với tabs (overview / items / timeline), **status workflow** dạng state machine (pending → processing → shipped → delivered, validate transition cả server lẫn UI).
- **Notifications** — chuông thông báo trên header, badge số chưa đọc, polling 30s.
- **Command palette** — `Ctrl+K`: điều hướng (lọc theo quyền) + quick actions (theme, ngôn ngữ, logout).
- **Wizard nhiều bước** — validate từng bước bằng zod, draft lưu localStorage (rời trang quay lại vẫn giữ tiến độ).
- **Feature flags** (`shared/config/feature-flags.ts` + `<FeatureGate>`), **env validation** bằng zod (`src/env.ts`).
- **Testing**: Vitest + Testing Library + MSW (56 unit/integration tests) + Playwright E2E + GitHub Actions CI. Xem [docs/TESTING.md](docs/TESTING.md).

## Tech stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, `proxy.ts`) |
| UI | shadcn/ui + Tailwind CSS v4 (CSS variables, oklch) |
| Server state | TanStack Query v5 (`queryOptions` + query-key factory) |
| Client state | Zustand (persist middleware) |
| HTTP | Axios (instance + interceptor chuẩn hóa lỗi) |
| Form | react-hook-form + zod v4 (`zodResolver`) |
| i18n | next-intl (cookie-based, không prefix URL) |
| Charts | Recharts (qua shadcn `ChartContainer`) |
| Mock API | Next.js Route Handlers (`src/app/api/**`) |
| Unit/Integration test | Vitest + @testing-library/react + MSW |
| E2E test | Playwright (Chromium) |
| CI | GitHub Actions (typecheck → lint → test → build → e2e) |

## Chạy dự án

```bash
npm install
npm run dev
```

Đăng nhập với **mật khẩu `Demo@123`** và một trong các tài khoản:

| Email | Vai trò | Quyền |
|---|---|---|
| `admin@acme.io` | Admin | Toàn quyền (kể cả xóa user) |
| `manager@acme.io` | Manager | Xem/tạo/sửa user, không xóa |
| `viewer@acme.io` | Viewer | Chỉ xem dashboard (vào `/users` sẽ bị chặn → `/403`) |

## Cấu trúc thư mục

Codebase theo **Feature-Sliced Design (FSD)** — chia theo tầng, enforce bằng **Steiger** (`npm run fsd:lint`).

```
src/
├── app/                    # CHỈ routing Next — page.tsx re-export mỏng từ _pages + api/**
│   ├── (auth)/login/       # Route group công khai
│   ├── (dashboard)/        # Route group được bảo vệ (sidebar shell + session)
│   └── api/                # Mock API (route handlers) — thay bằng backend thật khi sẵn sàng
├── _app/                   # FSD app layer: provider composition
├── _pages/                 # FSD pages layer: composition mỗi màn hình (login, dashboard, users…)
├── widgets/                # Khối UI ghép: app-sidebar, app-header, org-console, dashboard-overview
├── features/               # Tương tác có mutation: auth-by-credentials, manage-company, theme…
│   └── manage-company/
│       ├── ui/             # dialog/form
│       ├── model/hooks.ts  # mutation hooks (react-query + toast + invalidate)
│       └── index.ts        # public API
├── entities/               # Khái niệm nghiệp vụ: company, user, team, session…
│   └── company/
│       ├── model/          # types + zod schemas
│       ├── api/            # *.api.ts (axios) + *.queries.ts (query-options factory)
│       ├── ui/             # badge… hiển thị
│       └── index.ts        # public API
├── shared/                 # Nền không gắn nghiệp vụ
│   ├── ui/                 # shadcn/ui — generated, import per-module (@/shared/ui/button)
│   ├── api/                # axios, query-client, server (BFF), envelope types
│   ├── lib/                # utils, auth/token, use-debounce…
│   └── config/             # permissions, routes, nav, feature-flags, i18n + messages
├── mocks/                  # In-memory DB cho mock API
└── proxy.ts                # Route protection (Next 16, thay middleware)
```

### Quy tắc phụ thuộc (import rules)

```
_app → _pages → widgets → features → entities → shared      (chỉ import ĐI XUỐNG)
```

- Slice chỉ import từ **tầng dưới**; **slice cùng tầng KHÔNG import lẫn nhau** (`manage-team` ✗→ `manage-user`). Cần dùng chung → đưa xuống `entities`/`shared` hoặc gộp slice.
- Ngoài slice chỉ import qua **public API** `index.ts`. Enforce bằng **Steiger** (`fsd/forbidden-imports`).
- `app/**` là routing Next: `page.tsx` re-export mỏng từ `_pages`; `app/api/**` handlers import contract thẳng từ `entities`.
- `shared/ui` là generated shadcn — import theo module, không barrel.

Chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Các hệ thống chính

### 1. Phân quyền (RBAC)

Nguồn chân lý duy nhất: `src/shared/config/permissions.ts` (role → permissions). Được enforce ở **3 lớp**:

1. **Proxy** (`src/proxy.ts`): chưa đăng nhập → `/login`; thiếu quyền theo `ROUTE_PERMISSIONS` → `/403`.
2. **API** (`src/shared/api/server.ts` → `requireAuth(request, "users:delete")`): trả 401/403 đúng envelope.
3. **UI**: `<PermissionGate permission="users:create">` hoặc `usePermission().can(...)` — ẩn nút/menu.

Thêm permission mới: khai báo trong `PERMISSIONS` → gán vào `ROLE_PERMISSIONS` → dùng ở 3 lớp trên.

### 2. Theme (màu / bo góc / mật độ spacing)

- Dark/light: `next-themes` (class `dark` trên `<html>`).
- Preset màu, radius, density: `features/theme/model/preferences-store.ts` (Zustand persist) set các attribute `data-preset` / `data-radius` / `data-density` lên `<html>`; CSS trong `globals.css` phản ứng theo. Density hoạt động nhờ Tailwind v4 tính mọi spacing utility bằng `calc(var(--spacing) * n)`.
- Chống flash: inline script trong `app/layout.tsx` đọc localStorage trước khi hydrate.
- UI chỉnh: icon cây cọ trên header (popover) hoặc **Settings → Appearance**.

Thêm preset màu mới: thêm tên vào `THEME_PRESETS` (store) + khối CSS `:root[data-preset="..."]` và `.dark[data-preset="..."]` trong `globals.css` + swatch trong `features/theme/ui/theme-customizer.tsx`.

### 3. Đa ngôn ngữ (i18n)

- Locale lưu trong cookie `NEXT_LOCALE` — không đổi URL, phù hợp dashboard. (Đổi sang routing-based của next-intl nếu cần SEO.)
- Messages: `src/shared/config/i18n/messages/{en,vi}.json`, chia theo namespace (`common`, `nav`, `users`...).
- Server component: `getTranslations()`. Client: `useTranslations()`. Format ngày/số: `useFormatter()`.
- Validation message đa ngôn ngữ: schema là **factory** nhận translator — `createUserFormSchema(t)`; server gọi không tham số → fallback tiếng Anh.

### 4. Data fetching (TanStack Query — query-options factory)

Reads sống ở **entity**, writes sống ở **feature**:

```
entities/company/api/company.api.ts       # companyApi.list()  — axios, contract với backend
entities/company/api/company.queries.ts   # companyQueries.all/lists/list — query-options factory
  → component: useQuery(companyQueries.list(params))
features/manage-company/model/hooks.ts     # useCreateCompany() — mutation
```

Mutation luôn: toast kết quả + `invalidateQueries({ queryKey: companyQueries.all() })`. Không viết query key inline.

### 5. Mock API → Backend thật

Mock nằm ở `src/app/api/**` với envelope thống nhất `{ data }` / `{ error: { code, message } }`. Khi có backend:

1. Đổi `NEXT_PUBLIC_API_URL` trong `.env` sang URL thật.
2. Xóa `src/app/api` + `src/mocks`.
3. Thay `encode/decodeSessionToken` (`shared/lib/auth/token.ts`) bằng verify JWT thật.

Feature layer không đổi một dòng nào vì chỉ phụ thuộc contract.

## Quy ước làm việc nhóm (10 người)

- **Ownership theo slice**: mỗi người/cặp own vài slice `entities/*` + `features/*` — PR hiếm khi conflict vì ranh giới rõ.
- **Thêm màn hình mới**: `entities/<x>/` (model→api→ui) → `features/manage-<x>/` (ui+mutation hooks) → `_pages/<x>/` → `app/**/page.tsx` re-export → nav item `shared/config/nav.ts` → permission nếu cần → messages en+vi. Xem checklist đầy đủ ở ARCHITECTURE §7.
- **File chung cần review kỹ** (đề xuất khai báo CODEOWNERS): `shared/**`, `_app/**`, `globals.css`, `shared/config/i18n/messages/*.json`.
- **Đặt tên**: file kebab-case (`user-form-dialog.tsx`), component PascalCase, hooks `use-*`.
- **Không hardcode**: path → `shared/config/routes.ts`; text hiển thị → messages; màu/spacing → design tokens.

Chi tiết hơn: xem [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Scripts

```bash
npm run dev            # Dev server (Turbopack)
npm run build          # Production build
npm run start          # Chạy bản build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # Vitest (unit + integration)
npm run test:watch     # Vitest watch mode (TDD)
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E (cần: npx playwright install chromium)
```
