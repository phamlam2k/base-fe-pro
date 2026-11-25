/** Public API of the `change-password` feature (FSD). */
export { ChangePasswordForm } from "./ui/change-password-form";
export { useChangePassword } from "./model/hooks";
export {
  createChangePasswordSchema,
  type ChangePasswordValues,
} from "./model/schemas";
