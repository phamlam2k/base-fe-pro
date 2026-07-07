/** Public API of the `session` entity (the current user). */
export {
  SessionProvider,
  useSession,
  usePermission,
  type SessionUser,
} from "./model/session-context";
export { PermissionGate } from "./ui/permission-gate";
