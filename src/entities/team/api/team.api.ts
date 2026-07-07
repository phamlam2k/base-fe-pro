import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type { Team, TeamFormValues } from "@/entities/team/model/team";

/** Raw HTTP calls for the Team entity. */
export const teamApi = {
  list: async (projectId: string): Promise<Team[]> => {
    const res = await apiClient.get<ApiResponse<Team[]>>("/organization/teams", {
      params: { projectId },
    });
    return res.data.data;
  },
  create: async (projectId: string, input: TeamFormValues): Promise<Team> => {
    const res = await apiClient.post<ApiResponse<Team>>("/organization/teams", {
      ...input,
      projectId,
    });
    return res.data.data;
  },
  update: async (id: string, input: { name: string }): Promise<Team> => {
    const res = await apiClient.patch<ApiResponse<Team>>(
      `/organization/teams/${id}`,
      input,
    );
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/teams/${id}`);
  },
};
