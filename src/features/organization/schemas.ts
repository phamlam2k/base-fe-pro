/**
 * Organization domain schemas — compatibility bridge.
 * All form/query schemas graduated to their FSD entities; re-exported here for
 * the not-yet-migrated UI + proxy routes. Removed once P3–P5 repoint consumers.
 */
export { createCompanyFormSchema, companyListQuerySchema } from "@/entities/company";
export type { CompanyFormValues } from "@/entities/company";
export { createMemberFormSchema, memberListQuerySchema } from "@/entities/company-member";
export type { MemberFormValues } from "@/entities/company-member";
export { createProjectFormSchema } from "@/entities/project";
export type { ProjectFormValues } from "@/entities/project";
export { createTeamFormSchema } from "@/entities/team";
export type { TeamFormValues } from "@/entities/team";
export { createTeamMemberFormSchema } from "@/entities/team-member";
export type { TeamMemberFormValues } from "@/entities/team-member";
