import { vi } from "vitest";

/**
 * Shared next/navigation mock (wired up in src/test/setup.ts).
 * Import `mockRouter` in tests to assert navigation:
 *
 *   expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard");
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationMock = {
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
};
