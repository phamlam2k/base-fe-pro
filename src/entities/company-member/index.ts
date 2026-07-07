/** Public API of the `company-member` entity (FSD). */
export { companyMemberApi } from "./api/company-member.api";
export { companyMemberQueries } from "./api/company-member.queries";
export { MemberRoleBadge } from "./ui/member-role-badge";
export {
  ORG_ROLES,
  createMemberFormSchema,
  memberListQuerySchema,
} from "./model/company-member";
export type {
  Member,
  OrgRole,
  MemberListParams,
  MemberCreateInput,
  MemberFormValues,
} from "./model/company-member";
