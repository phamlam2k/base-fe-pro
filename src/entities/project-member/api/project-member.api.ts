import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type { ProjectMember } from "@/entities/project-member/model/project-member";

/** Raw HTTP calls for the project-member entity. */
export const projectMemberApi = {
  list: async (projectId: string): Promise<ProjectMember[]> => {
    const res = await apiClient.get<ApiResponse<ProjectMember[]>>(
      "/organization/project-members",
      { params: { projectId } },
    );
    return res.data.data;
  },
  create: async (
    projectId: string,
    companyMemberId: string,
  ): Promise<ProjectMember> => {
    const res = await apiClient.post<ApiResponse<ProjectMember>>(
      "/organization/project-members",
      { projectId, companyMemberId },
    );
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/project-members/${id}`);
  },
};
