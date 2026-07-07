"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  companyListOptions,
  memberListOptions,
  organizationApi,
  organizationKeys,
  projectListOptions,
  projectMemberListOptions,
  teamListOptions,
  teamMemberListOptions,
  userLookupOptions,
  type MemberCreateInput,
  type TeamMemberCreateInput,
} from "@/features/organization/api";
import type {
  CompanyFormValues,
  MemberFormValues,
  ProjectFormValues,
  TeamFormValues,
  TeamMemberFormValues,
} from "@/features/organization/schemas";
import type {
  CompanyListParams,
  MemberListParams,
} from "@/features/organization/types";

// --- Queries -----------------------------------------------------------------
export function useCompanies(params: CompanyListParams) {
  return useQuery(companyListOptions(params));
}

export function useMembers(params: MemberListParams) {
  return useQuery(memberListOptions(params));
}

export function useProjects(companyId: string) {
  return useQuery(projectListOptions(companyId));
}

export function useTeams(projectId: string) {
  return useQuery(teamListOptions(projectId));
}

// --- Company mutations -------------------------------------------------------
export function useCreateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: CompanyFormValues) => organizationApi.createCompany(input),
    onSuccess: () => {
      toast.success(t("toasts.companyCreated"));
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyFormValues> }) =>
      organizationApi.updateCompany(id, input),
    onSuccess: () => {
      toast.success(t("toasts.companyUpdated"));
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Member mutations --------------------------------------------------------
export function useUserLookup(search: string) {
  return useQuery(userLookupOptions(search));
}

export function useCreateMember(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: MemberCreateInput) =>
      organizationApi.createMember(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.memberCreated"));
      qc.invalidateQueries({ queryKey: organizationKeys.members() });
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberFormValues> }) =>
      organizationApi.updateMember(id, input),
    onSuccess: () => {
      toast.success(t("toasts.memberUpdated"));
      qc.invalidateQueries({ queryKey: organizationKeys.members() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => organizationApi.removeMember(id),
    onSuccess: () => {
      toast.success(t("toasts.memberDeleted"));
      qc.invalidateQueries({ queryKey: organizationKeys.members() });
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Project mutations -------------------------------------------------------
export function useCreateProject(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: ProjectFormValues) =>
      organizationApi.createProject(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.projectCreated"));
      qc.invalidateQueries({ queryKey: organizationKeys.projects(companyId) });
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProject(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectFormValues> }) =>
      organizationApi.updateProject(id, input),
    onSuccess: () => {
      toast.success(t("toasts.projectUpdated"));
      qc.invalidateQueries({ queryKey: organizationKeys.projects(companyId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProject(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => organizationApi.removeProject(id),
    onSuccess: () => {
      toast.success(t("toasts.projectDeleted"));
      qc.invalidateQueries({ queryKey: organizationKeys.projects(companyId) });
      qc.invalidateQueries({ queryKey: organizationKeys.companies() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Team mutations ----------------------------------------------------------
export function useCreateTeam(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: TeamFormValues) =>
      organizationApi.createTeam(projectId, input),
    onSuccess: () => {
      toast.success(t("toasts.teamCreated"));
      qc.invalidateQueries({ queryKey: organizationKeys.teams(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTeam(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      organizationApi.updateTeam(id, { name }),
    onSuccess: () => {
      toast.success(t("toasts.teamUpdated"));
      qc.invalidateQueries({ queryKey: organizationKeys.teams(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTeam(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => organizationApi.removeTeam(id),
    onSuccess: () => {
      toast.success(t("toasts.teamDeleted"));
      qc.invalidateQueries({ queryKey: organizationKeys.teams(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Team member (TVGS / Nhà Thầu / Thí Nghiệm) ------------------------------
export function useTeamMembers(teamId: string) {
  return useQuery(teamMemberListOptions(teamId));
}

export function useCreateTeamMember(teamId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: TeamMemberCreateInput) =>
      organizationApi.createTeamMember(teamId, input),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberAdded"));
      qc.invalidateQueries({ queryKey: organizationKeys.teamMembers(teamId) });
      qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTeamMember(teamId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TeamMemberFormValues> }) =>
      organizationApi.updateTeamMember(id, input),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberUpdated"));
      qc.invalidateQueries({ queryKey: organizationKeys.teamMembers(teamId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTeamMember(teamId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => organizationApi.removeTeamMember(id),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberRemoved"));
      qc.invalidateQueries({ queryKey: organizationKeys.teamMembers(teamId) });
      qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Project member (internal, chủ đầu tư side) ------------------------------
export function useProjectMembers(projectId: string) {
  return useQuery(projectMemberListOptions(projectId));
}

export function useCreateProjectMember(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (companyMemberId: string) =>
      organizationApi.createProjectMember(projectId, companyMemberId),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberAdded"));
      qc.invalidateQueries({ queryKey: organizationKeys.projectMembers(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProjectMember(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => organizationApi.removeProjectMember(id),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberRemoved"));
      qc.invalidateQueries({ queryKey: organizationKeys.projectMembers(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
}
