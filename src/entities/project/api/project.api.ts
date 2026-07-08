import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";

import type {
  GeoPolygon,
  Project,
  ProjectFormValues,
  ProjectZones,
} from "@/entities/project/model/project";

/** Raw HTTP calls for the Project entity. */
export const projectApi = {
  list: async (companyId: string): Promise<Project[]> => {
    const res = await apiClient.get<ApiResponse<Project[]>>("/organization/projects", {
      params: { companyId },
    });
    return res.data.data;
  },
  create: async (companyId: string, input: ProjectFormValues): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>("/organization/projects", {
      ...input,
      companyId,
    });
    return res.data.data;
  },
  update: async (id: string, input: Partial<ProjectFormValues>): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<Project>>(
      `/organization/projects/${id}`,
      input,
    );
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/organization/projects/${id}`);
  },

  // --- Zones (site boundaries) -----------------------------------------------
  getZones: async (id: string): Promise<ProjectZones> => {
    const res = await apiClient.get<ApiResponse<ProjectZones>>(
      `/organization/projects/${id}/zone`,
    );
    return res.data.data;
  },
  saveZones: async (id: string, polygons: GeoPolygon[]): Promise<ProjectZones> => {
    const res = await apiClient.patch<ApiResponse<ProjectZones>>(
      `/organization/projects/${id}/zone`,
      { polygons },
    );
    return res.data.data;
  },
};
