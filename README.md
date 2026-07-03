# Base FE Pro — Advanced Next.js Boilerplate

Bản nâng cao của `base-fe`: nhiều feature phức tạp hơn và **bộ test đầy đủ theo chuẩn công ty product lớn**. Thiết kế để team ~10 người làm việc song song mà không dẫm chân nhau.

**Có gì thêm so với base-fe:**

- **Products** — bulk selection + bulk delete, filter đồng bộ lên URL (share được link), optimistic delete (rollback khi lỗi), export CSV, ẩn/hiện cột.
- **Orders** — trang chi tiết `/orders/[id]` với tabs (overview / items / timeline), **status workflow** dạng state machine (pending → processing → shipped → delivered, validate transition cả server lẫn UI).
- **Notifications** — chuông thông báo trên header, badge số chưa đọc, polling 30s.
- **Command palette** — `Ctrl+K`: điều hướng (lọc theo quyền) + quick actions (theme, ngôn ngữ, logout).
- **Wizard nhiều bước** — validate từng bước bằng zod, draft lưu localStorage (rời trang quay lại vẫn giữ tiến độ).
- **Feature flags** (`config/feature-flags.ts` + `<FeatureGate>`), **env validation** bằng zod (`src/env.ts`).
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

```
src/
├── app/                    # CHỈ routing — page/layout mỏng, không chứa logic
│   ├── (auth)/login/       # Route group công khai
│   ├── (dashboard)/        # Route group được bảo vệ (sidebar shell + session)
│   └── api/                # Mock API (route handlers) — thay bằng backend thật khi sẵn sàng
├── components/
│   ├── ui/                 # shadcn/ui — code generated, hạn chế sửa tay
│   ├── layout/             # Shell: sidebar, header, user-nav, theme customizer
│   └── shared/             # Tái sử dụng cross-feature: DataTable, PageHeader, PermissionGate...
├── features/               # ⭐ Mỗi domain một module: auth, users, dashboard, settings...
│   └── users/
│       ├── api.ts          # HTTP calls + query-key factory + queryOptions
│       ├── hooks.ts        # useUsers, useCreateUser... (react-query + toast)
│       ├── schemas.ts      # zod schemas (factory nhận translator)
│       ├── types.ts        # Types của domain
│       └── components/     # UI riêng của feature
├── config/                 # permissions.ts (RBAC), routes.ts, nav.ts, site.ts
├── lib/                    # api/axios.ts, api/query-client.ts, auth/*, utils.ts
├── providers/              # AppProviders, QueryProvider, SessionProvider
├── stores/                 # Zustand stores (preferences-store: màu/radius/density)
├── hooks/                  # Hooks dùng chung (use-debounce, use-mobile)
├── i18n/ + messages/       # next-intl config + en.json / vi.json
├── mocks/                  # In-memory DB cho mock API
├── types/                  # Types dùng chung (API envelope, pagination)
└── proxy.ts                # Route protection (Next 16, thay middleware)
```

### Quy tắc phụ thuộc (import rules)

```
app → features → shared (components/lib/hooks/config/types)
```

- Mỗi feature có **public API** là `index.ts` — code bên ngoài chỉ được import `@/features/<name>` (hoặc contract modules `types`/`schemas`/`lib`). Deep import vào internals bị **ESLint chặn** (`eslint.config.mjs`).
- Cross-feature chỉ đi **một chiều**: composite (orders, dashboard, notifications) → core (auth, users, products), không bao giờ ngược lại. Hai feature cần lẫn nhau = ranh giới sai → gộp hoặc tách phần chung xuống `shared`/`types`.
- `app/**` là **route adapter**: metadata, params, auth server-side, và compose các feature — page được import nhiều feature cùng lúc.
- `components/ui` không import gì ngoài lib — giữ nguyên là generated code.

Chi tiết + 4 cấp xử lý cross-feature: [docs/ARCHITECTURE.md §9](docs/ARCHITECTURE.md).

## Các hệ thống chính

### 1. Phân quyền (RBAC)

Nguồn chân lý duy nhất: `src/config/permissions.ts` (role → permissions). Được enforce ở **3 lớp**:

1. **Proxy** (`src/proxy.ts`): chưa đăng nhập → `/login`; thiếu quyền theo `ROUTE_PERMISSIONS` → `/403`.
2. **API** (`src/lib/api/server.ts` → `requireAuth(request, "users:delete")`): trả 401/403 đúng envelope.
3. **UI**: `<PermissionGate permission="users:create">` hoặc `usePermission().can(...)` — ẩn nút/menu.

Thêm permission mới: khai báo trong `PERMISSIONS` → gán vào `ROLE_PERMISSIONS` → dùng ở 3 lớp trên.

### 2. Theme (màu / bo góc / mật độ spacing)

- Dark/light: `next-themes` (class `dark` trên `<html>`).
- Preset màu, radius, density: `stores/preferences-store.ts` (Zustand persist) set các attribute `data-preset` / `data-radius` / `data-density` lên `<html>`; CSS trong `globals.css` phản ứng theo. Density hoạt động nhờ Tailwind v4 tính mọi spacing utility bằng `calc(var(--spacing) * n)`.
- Chống flash: inline script trong `app/layout.tsx` đọc localStorage trước khi hydrate.
- UI chỉnh: icon cây cọ trên header (popover) hoặc **Settings → Appearance**.

Thêm preset màu mới: thêm tên vào `THEME_PRESETS` (store) + khối CSS `:root[data-preset="..."]` và `.dark[data-preset="..."]` trong `globals.css` + swatch trong `theme-customizer.tsx`.

### 3. Đa ngôn ngữ (i18n)

- Locale lưu trong cookie `NEXT_LOCALE` — không đổi URL, phù hợp dashboard. (Đổi sang routing-based của next-intl nếu cần SEO.)
- Messages: `src/messages/{en,vi}.json`, chia theo namespace (`common`, `nav`, `users`...).
- Server component: `getTranslations()`. Client: `useTranslations()`. Format ngày/số: `useFormatter()`.
- Validation message đa ngôn ngữ: schema là **factory** nhận translator — `createUserFormSchema(t)`; server gọi không tham số → fallback tiếng Anh.

### 4. Data fetching (TanStack Query)

Mỗi feature có các tầng trong `api.ts` + `hooks.ts`:

```
usersApi.list()            # axios call thuần — contract với backend
userKeys.list(params)      # query-key factory phân cấp — invalidate theo cây
userListOptions(params)    # queryOptions — dùng được cả useQuery lẫn prefetch
useUsers(params)           # hook cho component
```

Mutation luôn: toast kết quả + `invalidateQueries({ queryKey: userKeys.all })`.

### 5. Mock API → Backend thật

Mock nằm ở `src/app/api/**` với envelope thống nhất `{ data }` / `{ error: { code, message } }`. Khi có backend:

1. Đổi `NEXT_PUBLIC_API_URL` trong `.env` sang URL thật.
2. Xóa `src/app/api` + `src/mocks`.
3. Thay `encode/decodeSessionToken` (`lib/auth/token.ts`) bằng verify JWT thật.

Feature layer không đổi một dòng nào vì chỉ phụ thuộc contract.

## Quy ước làm việc nhóm (10 người)

- **Ownership theo feature**: mỗi người/cặp own một thư mục `features/*` — PR hiếm khi conflict vì không đụng file chung.
- **Thêm màn hình mới**: tạo `features/<domain>/` (types → schemas → api → hooks → components) → page mỏng trong `app/` → nav item trong `config/nav.ts` → permission nếu cần → messages en+vi.
- **File chung cần review kỹ** (đề xuất khai báo CODEOWNERS): `config/**`, `lib/**`, `components/shared/**`, `providers/**`, `globals.css`, `messages/*.json`.
- **Đặt tên**: file kebab-case (`user-form-dialog.tsx`), component PascalCase, hooks `use-*`.
- **Không hardcode**: path → `config/routes.ts`; text hiển thị → `messages/*.json`; màu/spacing → design tokens.

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
