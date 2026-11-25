import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import {
  placementsPayload,
  type Team,
  type TeamFormValues,
} from "@/entities/team/model/team";

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
      projectId,
      name: input.name,
      teamType: input.teamType,
      placements: placementsPayload(input.placementKeys),
    });
    return res.data.data;
  },
  /** ``placementKeys`` có mặt → thay toàn bộ vị trí (nhiều cha) của nhóm. */
  update: async (
    id: string,
    input: { name: string; placementKeys?: string[] },
  ): Promise<Team> => {
    const res = await apiClient.patch<ApiResponse<Team>>(`/organization/teams/${id}`, {
      name: input.name,
      ...(input.placementKeys ? { placements: placementsPayload(input.placementKeys) } : {}),
    });
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/teams/${id}`);
  },
};
