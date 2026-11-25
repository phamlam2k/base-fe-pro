import "server-only";

import { cookies } from "next/headers";

import {
  AUTH_COOKIE,
  COOKIE_SECURE,
  SESSION_MAX_AGE_SECONDS,
  decodeSessionToken,
  encodeSessionToken,
} from "@/shared/lib/auth/token";
import type { Paginated } from "@/shared/api/types";

/**
 * Server-side client for the real Django backend.
 *
 * The browser never talks to Django directly — it calls our Next `/api/**`
 * route handlers, which use THIS module to forward the request with the JWT
 * stored in the httpOnly session cookie. Benefits:
 *   - the access/refresh tokens stay httpOnly (safe from XSS),
 *   - snake_case ↔ camelCase + DRF pagination are normalized in one place,
 *   - a 401 transparently refreshes the token and rotates the cookie.
 */

const BACKEND_URL = (
  process.env.BACKEND_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Case conversion (deep)
// ---------------------------------------------------------------------------
const toSnakeKey = (key: string) =>
  key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamelKey = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

type Json = unknown;

function convertKeys(
  value: Json,
  fn: (key: string) => string,
  preserve: ReadonlySet<string>,
): Json {
  if (Array.isArray(value))
    return value.map((item) => convertKeys(item, fn, preserve));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, Json>).map(([k, v]) => [
        fn(k),
        // Opaque JSON blobs (e.g. a PDF template's `fields`) hold literal
        // camelCase property names like `dataKey` that must round-trip
        // verbatim — converting them would mint a divergent `data_key` that
        // collides with `dataKey` when camelized back on the next read.
        preserve.has(k) ? v : convertKeys(v, fn, preserve),
      ]),
    );
  }
  return value;
}

const NO_PRESERVE: ReadonlySet<string> = new Set();

export const camelize = (
  value: Json,
  preserve: ReadonlySet<string> = NO_PRESERVE,
) => convertKeys(value, toCamelKey, preserve);
export const snakeize = (
  value: Json,
  preserve: ReadonlySet<string> = NO_PRESERVE,
) => convertKeys(value, toSnakeKey, preserve);

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
export interface BackendResult<T = Json> {
  status: number;
  ok: boolean;
  data: T;
}

export function backendUrl(path: string): string {
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJson(response: Response): Promise<Json> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

async function doFetch(
  path: string,
  init: RequestInit,
  accessToken: string | undefined,
): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

/** Exchange a refresh token for a fresh access token (SimpleJWT rotates it). */
async function refreshAccess(
  refresh: string,
): Promise<{ access: string; refresh: string } | null> {
  const response = await fetch(backendUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access: string; refresh?: string };
  return { access: data.access, refresh: data.refresh ?? refresh };
}

/**
 * Gọi backend bằng JWT trong cookie phiên; gặp 401 thì làm mới token, xoay cookie và
 * thử lại 1 lần. Trả Response thô — dùng trực tiếp cho body không phải JSON (multipart).
 */
export async function fetchWithSession(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const cookieStore = await cookies();
  const session = decodeSessionToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) return new Response(null, { status: 401 });

  let response = await doFetch(path, init, session.access);

  if (response.status === 401 && session.refresh) {
    const refreshed = await refreshAccess(session.refresh);
    if (refreshed) {
      cookieStore.set(
        AUTH_COOKIE,
        encodeSessionToken({ ...session, ...refreshed }),
        {
          httpOnly: true,
          sameSite: "lax",
          secure: COOKIE_SECURE,
          path: "/",
          maxAge: SESSION_MAX_AGE_SECONDS,
        },
      );
      response = await doFetch(path, init, refreshed.access);
    }
  }
  return response;
}

export interface CallOptions {
  method?: string;
  /** camelCase body — converted to snake_case before sending. */
  body?: Json;
  /** Skip the session cookie (used by the login exchange). */
  anonymous?: boolean;
  /** Explicit bearer token, e.g. right after obtaining it at login. */
  accessToken?: string;
  /**
   * Keys whose values are opaque JSON blobs — kept verbatim instead of having
   * their nested keys snake/camel converted in either direction. Use for a PDF
   * template's `fields` (items carry literal camelCase props like `dataKey`).
   */
  preserveKeys?: string[];
}

/**
 * Call the backend using the current session's JWT. On a 401 it refreshes the
 * token, rotates the httpOnly cookie, and retries once. Response bodies are
 * camelCased. Throws only on network errors; HTTP errors are returned.
 */
export async function callBackend<T = Json>(
  path: string,
  options: CallOptions = {},
): Promise<BackendResult<T>> {
  const {
    method = "GET",
    body,
    anonymous = false,
    accessToken,
    preserveKeys,
  } = options;
  const preserve = preserveKeys ? new Set(preserveKeys) : NO_PRESERVE;
  const init: RequestInit = { method };
  if (body !== undefined) init.body = JSON.stringify(snakeize(body, preserve));

  if (anonymous || accessToken) {
    const response = await doFetch(path, init, accessToken);
    const data = camelize(await readJson(response), preserve);
    return { status: response.status, ok: response.ok, data: data as T };
  }

  const response = await fetchWithSession(path, init);
  const data = camelize(await readJson(response), preserve);
  return { status: response.status, ok: response.ok, data: data as T };
}

// ---------------------------------------------------------------------------
// DRF helpers
// ---------------------------------------------------------------------------
interface DrfPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function isDrfPage<T>(value: unknown): value is DrfPage<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "results" in value &&
    Array.isArray((value as DrfPage<T>).results)
  );
}

/** Reshape a DRF paginated payload into the app's `Paginated<T>` envelope. */
export function toPaginated<T>(
  data: unknown,
  page: number,
  pageSize: number,
): Paginated<T> {
  if (isDrfPage<T>(data)) {
    const total = data.count;
    return {
      items: data.results,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
  // Non-paginated list fallback.
  const items = (Array.isArray(data) ? data : []) as T[];
  return {
    items,
    page,
    pageSize,
    total: items.length,
    totalPages: 1,
  };
}

/** Unwrap a DRF list (paginated or not) into a plain array. */
export function toArray<T>(data: unknown): T[] {
  if (isDrfPage<T>(data)) return data.results;
  return (Array.isArray(data) ? data : []) as T[];
}

/** Best-effort human message from a DRF error body ({detail} or field errors). */
export function backendErrorMessage(data: unknown, fallback = "Yêu cầu thất bại."): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const first = Object.values(record)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return fallback;
}

/** Map a DRF ordering: (sortBy, sortOrder) → "field" | "-field". */
export function drfOrdering(
  field: string | undefined,
  order: string | undefined,
): string | undefined {
  if (!field) return undefined;
  return order === "asc" ? field : `-${field}`;
}
