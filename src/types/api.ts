/**
 * Shared API contract types.
 *
 * Every endpoint (mock or real) follows the same envelope so the whole team
 * consumes responses the same way. When you swap the mock API for a real
 * backend, only `NEXT_PUBLIC_API_URL` and the route handlers change.
 */

/** Successful response envelope: `{ data: ... }` */
export interface ApiResponse<T> {
  data: T;
}

/** Error response envelope: `{ error: { code, message } }` */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** Optional field-level validation errors keyed by field name. */
    details?: Record<string, string[]>;
  };
}

/** Paginated collection payload. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SortOrder = "asc" | "desc";

/** Common list-query params shared by paginated endpoints. */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}
