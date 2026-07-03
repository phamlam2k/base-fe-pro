# Testing Guide

Chiến lược test của codebase này theo **Testing Trophy** (Kent C. Dodds) — mô hình được các công ty product lớn (Vercel, Shopify, Airbnb...) áp dụng thay cho pyramid cổ điển: đầu tư nhiều nhất vào **integration tests** vì chúng cho độ tin cậy cao nhất trên mỗi dòng test.

```
        ▲  E2E (Playwright)        — ít, chỉ critical journeys
       ▲▲  Integration (Vitest+RTL+MSW) — NHIỀU NHẤT: component + hooks + network
      ▲▲▲  Unit (Vitest)           — logic thuần: state machine, schema, utils
     ▲▲▲▲  Static (TypeScript + ESLint)  — miễn phí, chạy mọi nơi
```

## Chạy test

```bash
npm run typecheck      # tầng static
npm run test           # unit + integration (vitest run)
npm run test:watch     # TDD mode
npm run test:coverage  # + báo cáo coverage (coverage/index.html)
npm run test:e2e       # Playwright (tự khởi động dev server)
npm run test:e2e:ui    # Playwright UI mode — debug từng bước
```

Lần đầu chạy E2E cần cài browser: `npx playwright install chromium`.

## Nguyên tắc cốt lõi

### 1. Mock ở NETWORK boundary, không mock module

Sai lầm phổ biến là `vi.mock("@/features/products/hooks")` — test kiểu đó chỉ chứng minh mock hoạt động. Ở đây dùng **MSW** (`src/test/msw/`): request đi qua **axios thật → interceptor thật → react-query thật**, chỉ có HTTP response là giả. Đổi implementation không làm gãy test; đổi behavior mới làm gãy test. Đó chính là mục đích.

```ts
// Override handler cho một test case cụ thể:
server.use(
  http.post("/api/auth/login", () =>
    HttpResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "..." } }, { status: 401 }),
  ),
);
```

`onUnhandledRequest: "error"` — request không có handler sẽ fail test ngay (không silent, không treo).

### 2. Query theo cách người dùng nhìn thấy (RTL)

Ưu tiên: `getByRole` (kèm accessible name) → `getByLabelText` → `getByPlaceholderText` → `getByText`. **`data-testid` là phương án cuối cùng** và phải có lý do. Nếu không query được bằng role, thường là component có vấn đề accessibility — sửa component, đừng thêm testid.

### 3. Test data qua factory, không viết literal

`src/test/factories.ts` — mỗi test chỉ khai báo field nó quan tâm:

```ts
buildSessionUser({ role: "viewer" })   // các field khác có default
buildProduct({ stock: 0 })
```

Khi entity thêm field, chỉ sửa factory — hàng trăm test không đổi.

### 4. Custom render với providers thật

Luôn dùng `renderWithProviders` từ `@/test/test-utils` (i18n + react-query + session). Muốn test theo role: `renderWithProviders(<X />, { sessionUser: buildSessionUser({ role: "viewer" }) })`.

### 5. Test phải deterministic

- Không retry trong test (`createTestQueryClient` tắt retry).
- Fake timers cho debounce/interval (`vi.useFakeTimers()` — xem `use-debounce.test.ts`).
- E2E dùng dữ liệu unique theo timestamp để retry không đụng nhau.
- Không phụ thuộc thứ tự test; `afterEach` reset MSW handlers + cleanup DOM + clear mocks (làm sẵn trong `setup.ts`).

## Test gì ở tầng nào?

| Code | Tầng | Ví dụ trong repo |
|---|---|---|
| Logic thuần (state machine, RBAC matrix, CSV, schema) | Unit | `orders/lib.test.ts`, `permissions.test.ts`, `csv.test.ts`, `products/schemas.test.ts` |
| Hooks có timing/effect | Unit + `renderHook` | `use-debounce.test.ts` |
| Store + side effect DOM | Unit | `preferences-store.test.ts` |
| Component có điều kiện render | Component | `permission-gate.test.tsx` |
| Form: validation, submit, lỗi server | Integration | `login-form.test.tsx` |
| Màn hình: fetch → render → tương tác → mutate | Integration | `products-view.test.tsx` |
| Journey xuyên trang + proxy + cookie thật | E2E | `e2e/auth.spec.ts`, `e2e/rbac.spec.ts`, `e2e/products.spec.ts` |

**Không test**: `components/ui/**` (code generated của shadcn), page files mỏng (E2E đã phủ), styles.

## Quy ước

- **Colocation**: `foo.test.ts(x)` nằm cạnh `foo.ts(x)`. E2E nằm riêng ở `/e2e` (chạy bằng runner khác).
- **Đặt tên**: mô tả hành vi, không mô tả implementation. ✅ `"allows cancellation only before shipping"` — ❌ `"calls setStatus"`.
- **Cấu trúc AAA** (Arrange – Act – Assert), một behavior mỗi `it`.
- **Table-driven** cho ma trận case: `it.each` (xem `permissions.test.ts`).
- Assert điều người dùng thấy (row biến mất, message hiện ra) thay vì internal state khi có thể.

## Coverage

- CI upload báo cáo coverage mỗi lần chạy (xem `.github/workflows/ci.yml`).
- Không đặt threshold toàn cục ngay từ đầu (dễ sinh test rác để đạt số). Khuyến nghị: khi feature ổn định, đặt threshold **theo thư mục logic quan trọng** (`src/config`, `src/features/*/lib.ts`, `src/lib`) rồi tăng dần (ratchet).

## Checklist khi thêm feature mới

1. Logic thuần (lib/schema) → unit test cùng PR.
2. Màn hình chính của feature → 1 integration test: render từ MSW + tương tác quan trọng nhất + phân quyền (role thấp nhất không thấy nút mutating).
3. Nếu feature nằm trên critical journey (đăng nhập, thanh toán...) → thêm/ mở rộng E2E spec.
4. Thêm default handler vào `src/test/msw/handlers.ts` nếu API mới được nhiều test dùng.
