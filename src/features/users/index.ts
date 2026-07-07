/**
 * Public API of the `users` feature — thinning bridge.
 *
 * Data access lives in `entities/user`; create/edit/delete moved to the
 * `manage-user` feature. This slice now just composes the users screen
 * (`UsersView`) and re-exports the user contract for the proxy routes +
 * dashboard until P5 repoints them at the entity.
 */
export { UsersView } from "./components/users-view";

export { SUPER_ADMIN_FILTERS } from "./types";
export type { User, SuperAdminFilter, UserListParams } from "./types";
