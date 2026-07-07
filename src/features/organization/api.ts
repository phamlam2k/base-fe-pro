import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/axios";
import type { ApiResponse } from "@/shared/api/types";
import type {
  ProjectFormValues,
  TeamFormValues,
  TeamMemberFormValues,
} from "@/features/organization/schemas";
import type {
  Project,
  ProjectMember,
  Team,
  TeamMember,
  TeamRole,
  UserOption,
} from "@/features/organization/types";

export interface TeamMemberCreateInput {
  userId: string;
  role: TeamRole;
}

const BASE = "/organization";

/** Raw HTTP calls — the contract only, no caching concerns. */
export const organizationApi = {
  // Companies → entities/company, company members → entities/company-member.
  // --- User lookup (member picker) ---
  lookupUsers: async (search: string): Promise<UserOption[]> => {
    const res = await apiClient.get<ApiResponse<UserOption[]>>(
      `${BASE}/users/lookup`,
      { params: { search } },
    );
    return res.data.data;
  },

  // --- Projects ---
  listProjects: async (companyId: string): Promise<Project[]> => {
    const res = await apiClient.get<ApiResponse<Project[]>>(`${BASE}/projects`, {
      params: { companyId },
    });
    return res.data.data;
  },
  createProject: async (companyId: string, input: ProjectFormValues): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>(`${BASE}/projects`, {
      ...input,
      companyId,
    });
    return res.data.data;
  },
  updateProject: async (id: string, input: Partial<ProjectFormValues>): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<Project>>(`${BASE}/projects/${id}`, input);
    return res.data.data;
  },
  removeProject: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/projects/${id}`);
  },

  // --- Teams (tree) ---
  listTeams: async (projectId: string): Promise<Team[]> => {
    const res = await apiClient.get<ApiResponse<Team[]>>(`${BASE}/teams`, {
      params: { projectId },
    });
    return res.data.data;
  },
  createTeam: async (projectId: string, input: TeamFormValues): Promise<Team> => {
    const res = await apiClient.post<ApiResponse<Team>>(`${BASE}/teams`, {
      ...input,
      projectId,
    });
    return res.data.data;
  },
  updateTeam: async (id: string, input: { name: string }): Promise<Team> => {
    const res = await apiClient.patch<ApiResponse<Team>>(`${BASE}/teams/${id}`, input);
    return res.data.data;
  },
  removeTeam: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/teams/${id}`);
  },

  // --- Team members (people inside a TVGS / Nhà Thầu / Thí Nghiệm) ---
  listTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const res = await apiClient.get<ApiResponse<TeamMember[]>>(`${BASE}/team-members`, {
      params: { teamId },
    });
    return res.data.data;
  },
  createTeamMember: async (
    teamId: string,
    input: TeamMemberCreateInput,
  ): Promise<TeamMember> => {
    const res = await apiClient.post<ApiResponse<TeamMember>>(`${BASE}/team-members`, {
      ...input,
      teamId,
    });
    return res.data.data;
  },
  updateTeamMember: async (
    id: string,
    input: Partial<TeamMemberFormValues>,
  ): Promise<TeamMember> => {
    const res = await apiClient.patch<ApiResponse<TeamMember>>(
      `${BASE}/team-members/${id}`,
      input,
    );
    return res.data.data;
  },
  removeTeamMember: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/team-members/${id}`);
  },

  // --- Project members (internal company members assigned to a project) ---
  listProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const res = await apiClient.get<ApiResponse<ProjectMember[]>>(
      `${BASE}/project-members`,
      { params: { projectId } },
    );
    return res.data.data;
  },
  createProjectMember: async (
    projectId: string,
    companyMemberId: string,
  ): Promise<ProjectMember> => {
    const res = await apiClient.post<ApiResponse<ProjectMember>>(
      `${BASE}/project-members`,
      { projectId, companyMemberId },
    );
    return res.data.data;
  },
  removeProjectMember: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/project-members/${id}`);
  },
};

/**
 * Hierarchical query-key factory. Invalidating `organizationKeys.all` clears
 * everything; narrower helpers let mutations invalidate precisely.
 */
export const organizationKeys = {
  all: ["organization"] as const,

  projects: (companyId: string) =>
    [...organizationKeys.all, "projects", companyId] as const,

  teams: (projectId: string) =>
    [...organizationKeys.all, "teams", projectId] as const,

  teamMembers: (teamId: string) =>
    [...organizationKeys.all, "team-members", teamId] as const,

  projectMembers: (projectId: string) =>
    [...organizationKeys.all, "project-members", projectId] as const,

  userLookup: (search: string) =>
    [...organizationKeys.all, "user-lookup", search] as const,
};

export function projectListOptions(companyId: string) {
  return queryOptions({
    queryKey: organizationKeys.projects(companyId),
    queryFn: () => organizationApi.listProjects(companyId),
    enabled: Boolean(companyId),
  });
}

export function teamListOptions(projectId: string) {
  return queryOptions({
    queryKey: organizationKeys.teams(projectId),
    queryFn: () => organizationApi.listTeams(projectId),
    enabled: Boolean(projectId),
  });
}

export function teamMemberListOptions(teamId: string) {
  return queryOptions({
    queryKey: organizationKeys.teamMembers(teamId),
    queryFn: () => organizationApi.listTeamMembers(teamId),
    enabled: Boolean(teamId),
  });
}

export function projectMemberListOptions(projectId: string) {
  return queryOptions({
    queryKey: organizationKeys.projectMembers(projectId),
    queryFn: () => organizationApi.listProjectMembers(projectId),
    enabled: Boolean(projectId),
  });
}

export function userLookupOptions(search: string) {
  return queryOptions({
    queryKey: organizationKeys.userLookup(search),
    queryFn: () => organizationApi.lookupUsers(search),
    placeholderData: keepPreviousData,
  });
}
