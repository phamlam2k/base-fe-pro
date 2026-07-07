import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  Member,
  MemberCreateInput,
  MemberFormValues,
  MemberListParams,
} from "@/entities/company-member/model/company-member";

/** Raw HTTP calls for the company-member entity (FSD `api` segment). */
export const companyMemberApi = {
  list: async (params: MemberListParams): Promise<Paginated<Member>> => {
    const res = await apiClient.get<ApiResponse<Paginated<Member>>>(
      "/organization/members",
      { params },
    );
    return res.data.data;
  },
  create: async (companyId: string, input: MemberCreateInput): Promise<Member> => {
    const res = await apiClient.post<ApiResponse<Member>>("/organization/members", {
      ...input,
      companyId,
    });
    return res.data.data;
  },
  update: async (id: string, input: Partial<MemberFormValues>): Promise<Member> => {
    const res = await apiClient.patch<ApiResponse<Member>>(
      `/organization/members/${id}`,
      input,
    );
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/members/${id}`);
  },
};
