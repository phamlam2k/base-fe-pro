import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  Company,
  CompanyFormValues,
  CompanyListParams,
} from "@/entities/company/model/company";

/** Raw HTTP calls for the Company entity (FSD `api` segment). */
export const companyApi = {
  list: async (params: CompanyListParams): Promise<Paginated<Company>> => {
    const res = await apiClient.get<ApiResponse<Paginated<Company>>>(
      "/organization/companies",
      { params },
    );
    return res.data.data;
  },
  create: async (input: CompanyFormValues): Promise<Company> => {
    const res = await apiClient.post<ApiResponse<Company>>(
      "/organization/companies",
      input,
    );
    return res.data.data;
  },
  update: async (id: string, input: Partial<CompanyFormValues>): Promise<Company> => {
    const res = await apiClient.patch<ApiResponse<Company>>(
      `/organization/companies/${id}`,
      input,
    );
    return res.data.data;
  },
};
