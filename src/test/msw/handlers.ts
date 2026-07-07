import { HttpResponse, http } from "msw";

/**
 * Default happy-path handlers. Tests override per-case with `server.use(...)`.
 * We mock at the NETWORK boundary (not axios, not the hooks) so tests
 * exercise the real client stack: axios interceptors, envelope parsing,
 * react-query caching.
 */
export const handlers = [
  http.get("/api/notifications", () =>
    HttpResponse.json({ data: { items: [], unreadCount: 0 } }),
  ),
];
