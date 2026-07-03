# Architecture Deep-Dive

Tài liệu này giải thích **tại sao** codebase được tổ chức như hiện tại và **cách mở rộng** nó. Đọc README.md trước để nắm tổng quan.

## 1. Triết lý: Feature-based, không phải layer-based

Tham khảo pattern của bulletproof-react / các codebase lớn (Vercel dashboard, Linear...): code được nhóm theo **domain nghiệp vụ** (`features/users`) thay vì theo loại file (`/hooks`, `/services`, `/components` toàn cục).

Lý do với team 10 người:

- **Locality**: sửa tính năng Users chỉ đụng `features/users/**` + 1 page mỏng → diff nhỏ, review nhanh, ít conflict.
- **Ownership rõ ràng**: mỗi feature một owner; file dùng chung (`config/`, `lib/`, `components/shared/`) thay đổi ít và được review chặt (CODEOWNERS).
- **Xóa được**: bỏ một tính năng = xóa một thư mục + một page, không để lại code mồ côi.

### Anatomy của một feature

```
features/users/
├── types.ts        # Entity + params types — KHÔNG import React
├── schemas.ts      # zod: form schema (factory nhận translator) + query schema
├── api.ts          # axios calls + query-key factory + queryOptions
├── hooks.ts        # useQuery/useMutation wrappers (toast, invalidation)
└── components/     # UI của feature; "view" component là entry point
    ├── users-view.tsx        # Container: own toàn bộ state của màn hình
    ├── user-columns.tsx      # Column factory cho DataTable
    └── user-form-dialog.tsx  # Create/Edit dialog
```

Page trong `app/` chỉ làm 3 việc: metadata, PageHeader (server-translated), render `<UsersView />`.

### Luật import (một chiều)

```
app ──→ features ──→ { components/shared, components/ui, lib, hooks, config, stores, providers, types }
```

- Feature không import feature khác. Ngoại lệ duy nhất hiện tại: `dashboard` dùng `User` type từ `users` — nếu điều này lan rộng, chuyển entity types xuống `src/types/`.
- Chưa enforce bằng ESLint; khi team đông, thêm `eslint-plugin-boundaries` để CI chặn vi phạm.

## 2. Data flow

```
Server Component (page)                Client Component
────────────────────────               ─────────────────────────────
getTranslations() → title              useQuery(userListOptions(params))
                                          │
                                          ▼
                                       usersApi.list() ──axios──→ /api/users (mock)
                                          │                          │ requireAuth()
                                          ▼                          ▼
                                       { data: Paginated<User> } ← jsonData()
```

- **Server state** = TanStack Query. Không copy response vào useState/zustand.
- **Client state** (UI preferences, filters...) = useState cục bộ; chỉ lên Zustand khi cần persist/global (ví dụ `preferences-store`).
- **Form state** = react-hook-form, validate bằng zod resolver.

Quy ước query key: factory phân cấp trong `api.ts` (`userKeys.all` → `lists()` → `list(params)`), mutation invalidate ở mức cao nhất hợp lý (`userKeys.all`).

## 3. Auth & session

Mock JWT = base64url(JSON payload) trong httpOnly cookie `base_fe_session`.

```
Login form ─POST /api/auth/login→ set-cookie ─router.refresh()→
  proxy.ts decode cookie (mọi navigation)
  (dashboard)/layout.tsx getCurrentUser() → <SessionProvider user>
      → useSession() / usePermission() ở mọi client component, không fetch thêm
```

Ba lớp enforcement (không được bỏ lớp nào):

| Lớp | File | Chặn gì |
|---|---|---|
| Proxy | `src/proxy.ts` + `config/routes.ts` | Điều hướng: login-redirect, /403 |
| API | `lib/api/server.ts` `requireAuth(req, permission)` | Dữ liệu: 401/403 |
| UI | `PermissionGate` / `usePermission` | Trải nghiệm: ẩn nút không dùng được |

Khi tích hợp backend thật: thay `encodeSessionToken`/`decodeSessionToken` bằng verify JWT (ví dụ `jose`), giữ nguyên interface `SessionTokenPayload`.

## 4. Theming

Ba trục độc lập, đều là CSS variables trên `<html>`:

| Trục | Cơ chế | Nơi định nghĩa |
|---|---|---|
| Dark/Light | class `dark` (next-themes) | `globals.css` `:root` / `.dark` |
| Màu chủ đạo | `data-preset="blue"...` | `globals.css` — override `--primary`, `--ring`, `--chart-*` |
| Bo góc | `data-radius="none|sm|md|xl"` | override `--radius` (mọi `rounded-*` của shadcn tính từ đây) |
| Mật độ | `data-density="compact|spacious"` | override `--spacing` — Tailwind v4 compile `p-4` thành `calc(var(--spacing)*4)` nên MỌI padding/gap/margin scale theo |

State + persist: `stores/preferences-store.ts`. Chống FOUC: inline script trong `app/layout.tsx` (phải sync key/defaults với store).

## 5. i18n

- `next-intl` chế độ **without i18n routing**: locale từ cookie `NEXT_LOCALE` (`src/i18n/request.ts`), đổi locale bằng server action + `router.refresh()`.
- Trade-off: không có URL /vi/... cho SEO — chấp nhận được cho dashboard sau đăng nhập. Nếu dự án mới cần SEO: chuyển sang `next-intl` routing (thêm `[locale]` segment), chỉ ảnh hưởng `app/` + `i18n/`.
- Messages theo namespace = tên feature. Thêm key mới: **bắt buộc thêm cả en.json lẫn vi.json** (nên có CI check so khớp key).
- Zod messages: schema factory `createXSchema(t?)` — client truyền `useTranslations("<ns>")`, server (route handler) gọi trần → English fallback.

## 6. Mock API

Chọn **Route Handlers** thay vì MSW vì: chạy thật qua network tab, dùng được cho cả SSR lẫn client, không cần service worker, và là chỗ demo luôn pattern `requireAuth`. DB in-memory seed deterministic (`src/mocks/db.ts`), cache trên `globalThis` để sống qua HMR.

Envelope chuẩn (áp dụng cho cả backend thật):

```jsonc
// 2xx
{ "data": ... }
// 4xx/5xx
{ "error": { "code": "EMAIL_TAKEN", "message": "...", "details": { "field": ["msg"] } } }
```

`lib/api/axios.ts` chuẩn hóa mọi lỗi thành `ApiError { status, code, message, details }` và tự redirect khi 401 (trừ chính request login).

## 7. Checklist thêm một feature mới

1. `src/features/<name>/types.ts` — entity + params.
2. `schemas.ts` — zod factory (nếu có form) + query schema (nếu có list).
3. `api.ts` — axios calls + key factory + `queryOptions`.
4. `hooks.ts` — query/mutation hooks (toast + invalidate).
5. `components/<name>-view.tsx` — container own state.
6. `app/(dashboard)/<route>/page.tsx` — metadata + PageHeader + View.
7. `config/nav.ts` — nav item (+ icon, + permission nếu cần).
8. `config/permissions.ts` + `config/routes.ts` — nếu cần quyền mới/route bảo vệ.
9. `messages/en.json` + `messages/vi.json` — namespace mới.
10. Mock: `src/app/api/<route>/route.ts` + seed trong `src/mocks` (nếu backend chưa sẵn sàng).
11. **Test cùng PR**: unit cho logic thuần, 1 integration test cho màn hình chính (xem `docs/TESTING.md`).

## 8. Các hệ thống riêng của bản Pro

- **Env validation** (`src/env.ts`): import `env` thay vì `process.env` — sai/thiếu biến sẽ fail ngay khi khởi động. Mỗi biến `NEXT_PUBLIC_*` phải liệt kê tường minh (Next inline lúc build).
- **Feature flags** (`config/feature-flags.ts`): mọi consumer đi qua `isFeatureEnabled` / `<FeatureGate>` — sau này thay bằng LaunchDarkly/Unleash chỉ sửa một file.
- **URL-synced filters** (`hooks/use-url-synced-state.ts`): state là source of truth, URL là mirror (init từ URL, ghi ngược qua `router.replace`). Chỉ giá trị khác default mới xuất hiện trên URL. Nhờ state-driven nên test không cần mô phỏng URL thật.
- **Status workflow** (`features/orders/lib.ts`): state machine thuần — server validate transition (409 INVALID_TRANSITION), UI chỉ render action hợp lệ (`nextStatuses`), unit test phủ toàn bộ ma trận.
- **Optimistic update** (`features/products/hooks.ts` → `useDeleteProduct`): mẫu chuẩn onMutate (cancel + snapshot + setQueriesData) / onError (rollback) / onSettled (invalidate) — copy khi cần mutation "cảm giác tức thì".
- **Testing**: toàn bộ quy ước trong `docs/TESTING.md`; hạ tầng ở `src/test/` (custom render, factories, MSW), E2E ở `/e2e`, CI ở `.github/workflows/ci.yml`.

## 9. Cross-feature: Public API + luật một chiều

Câu hỏi kinh điển: *"Page dùng feature A nhưng muốn mở modal của feature B thì sao?"* — trả lời theo 4 cấp, dùng cấp thấp nhất đủ giải quyết vấn đề:

| Cấp | Khi nào | Cách làm |
|---|---|---|
| 0. Compose ở page | Trigger nằm ở tầng page/layout | Page import cả A lẫn B — `app → features` vốn cho phép import nhiều feature |
| 1. Slot / callback | Trigger nằm trong cây của A, chỉ 1-2 chỗ | A nhận `renderRowExtra` / `onXxx` props; page cắm B vào |
| 2. Public API | Cross-feature lặp lại nhiều nơi | Import feature khác **qua `index.ts`** (xem dưới) |
| 3. Thăng cấp | Thứ được share không còn "thuộc về" B | Chuyển xuống `components/shared/` hoặc `src/types/` |

### Public API (cấp 2) — được enforce bằng ESLint

Mỗi feature có `index.ts` là **cửa chính**: chỉ export những gì cam kết ổn định (view, dialogs, hooks, query keys, types). Mọi thứ không export là internal, refactor tự do.

```ts
// ✅ Hợp lệ
import { UserFormDialog, userKeys, type User } from "@/features/users";
import { createUserFormSchema } from "@/features/users/schemas"; // contract module
// ❌ ESLint error — deep import vào internals
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
```

Quy tắc trong `eslint.config.mjs` (đọc danh sách feature từ filesystem — thêm feature mới không phải sửa config):

- Ngoài feature: chỉ được `@/features/<name>` và các **contract modules** `types` / `schemas` / `lib` (thuần túy, không dependency — an toàn cho route handlers/proxy import mà không kéo theo client components trong barrel).
- Trong feature: tự do với internals của chính mình, feature khác vẫn bị chặn.

### Luật một chiều (chống vòng tròn)

```
core:      auth, users, products        ← được import bởi tầng trên
composite: orders, dashboard, notifications  → import core, KHÔNG ngược lại
```

Nếu hai feature cần import lẫn nhau → ranh giới vẽ sai: hoặc gộp làm một, hoặc tách phần chung xuống `shared`/`types`. Ví dụ tham chiếu trong repo: `features/dashboard/components/recent-users.tsx` mở `UserFormDialog` của users qua public API (composite → core), và tự invalidate `dashboardKeys` khi dialog đóng — mỗi feature chịu trách nhiệm cache của mình.

Lưu ý: query keys (`userKeys`, `productKeys`...) là thứ *nên* share qua public API — react-query cache là một cây chung toàn app, hai feature tự chế key riêng cho cùng resource sẽ tạo hai bản cache lệch nhau.

## 10. Decision log

| Quyết định | Lý do | Xem lại khi |
|---|---|---|
| Cookie-based i18n (không prefix URL) | Dashboard không cần SEO; đơn giản hơn nhiều | Cần landing page đa ngôn ngữ |
| Mock bằng Route Handlers (không MSW) | Chạy cả SSR, thấy trong network tab, demo auth server-side | Cần mock trong unit test → thêm MSW riêng cho test |
| Zustand cho preferences (không Context) | Persist middleware + đọc ngoài React (inline script sync key) | — |
| Session qua server layout + Context (không /auth/me query) | 0 request thừa, user có sẵn lúc first paint | Cần refresh session real-time → thêm useQuery(me) làm nguồn thứ hai |
| Mock token base64 (không JWT lib) | Không cần crypto cho mock; interface giữ nguyên khi thay thật | Tích hợp backend → dùng `jose` verify |
| Schema factory cho i18n validation | Message dịch được mà server vẫn dùng chung schema | — |
