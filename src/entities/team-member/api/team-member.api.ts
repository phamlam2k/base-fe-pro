import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type {
  TeamMember,
  TeamMemberCreateInput,
  TeamMemberFormValues,
} from "@/entities/team-member/model/team-member";

/** Raw HTTP calls for the team-member entity. */
export const teamMemberApi = {
  list: async (teamId: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<ApiResponse<TeamMember[]>>(
      "/organization/team-members",
      { params: { teamId } },
    );
    return res.data.data;
  },
  create: async (
    teamId: string,
    input: TeamMemberCreateInput,
  ): Promise<TeamMember> => {
    const res = await apiClient.post<ApiResponse<TeamMember>>(
      "/organization/team-members",
      { ...input, teamId },
    );
    return res.data.data;
  },
  update: async (
    id: string,
    input: Partial<TeamMemberFormValues>,
  ): Promise<TeamMember> => {
    const res = await apiClient.patch<ApiResponse<TeamMember>>(
      `/organization/team-members/${id}`,
      input,
    );
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/team-members/${id}`);
  },
};
