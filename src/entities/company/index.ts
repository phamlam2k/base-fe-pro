/** Public API of the `company` entity (FSD). */
export { companyApi } from "./api/company.api";
export { companyQueries } from "./api/company.queries";
export { CompanyStatusBadge } from "./ui/company-status-badge";
export {
  COMPANY_STATUSES,
  createCompanyFormSchema,
  companyListQuerySchema,
} from "./model/company";
export type {
  Company,
  CompanyStatus,
  CompanyListParams,
  CompanyFormValues,
} from "./model/company";
