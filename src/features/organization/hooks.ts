"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  companyApi,
  companyQueries,
  type CompanyFormValues,
  type CompanyListParams,
} from "@/entities/company";
import {
  companyMemberApi,
  companyMemberQueries,
  type MemberCreateInput,
  type MemberFormValues,
  type MemberListParams,
} from "@/entities/company-member";
import { projectApi, projectQueries, type ProjectFormValues } from "@/entities/project";
import { projectMemberApi, projectMemberQueries } from "@/entities/project-member";
import { teamApi, teamQueries, type TeamFormValues } from "@/entities/team";
import {
  teamMemberApi,
  teamMemberQueries,
  type TeamMemberCreateInput,
  type TeamMemberFormValues,
} from "@/entities/team-member";
import { userQueries } from "@/entities/user";

// --- Queries -----------------------------------------------------------------
export function useCompanies(params: CompanyListParams) {
  return useQuery(companyQueries.list(params));
}

export function useMembers(params: MemberListParams) {
  return useQuery(companyMemberQueries.list(params));
}

export function useProjects(companyId: string) {
  return useQuery(projectQueries.list(companyId));
}

export function useTeams(projectId: string) {
  return useQuery(teamQueries.list(projectId));
}

export function useTeamMembers(teamId: string) {
  return useQuery(teamMemberQueries.list(teamId));
}

export function useProjectMembers(projectId: string) {
  return useQuery(projectMemberQueries.list(projectId));
}

export function useUserLookup(search: string) {
  return useQuery(userQueries.lookup(search));
}

// --- Company mutations -------------------------------------------------------
export function useCreateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: CompanyFormValues) => companyApi.create(input),
    onSuccess: () => {
      toast.success(t("toasts.companyCreated"));
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyFormValues> }) =>
      companyApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.companyUpdated"));
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Company-member mutations ------------------------------------------------
export function useCreateMember(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: MemberCreateInput) =>
      companyMemberApi.create(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.memberCreated"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberFormValues> }) =>
      companyMemberApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.memberUpdated"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => companyMemberApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.memberDeleted"));
      qc.invalidateQueries({ queryKey: companyMemberQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Project mutations -------------------------------------------------------
export function useCreateProject(companyId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: ProjectFormValues) => projectApi.create(companyId, input),
    onSuccess: () => {
      toast.success(t("toasts.projectCreated"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectFormValues> }) =>
      projectApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.projectUpdated"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.projectDeleted"));
      qc.invalidateQueries({ queryKey: projectQueries.all() });
      qc.invalidateQueries({ queryKey: companyQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Team mutations ----------------------------------------------------------
export function useCreateTeam(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: TeamFormValues) => teamApi.create(projectId, input),
    onSuccess: () => {
      toast.success(t("toasts.teamCreated"));
      qc.invalidateQueries({ queryKey: teamQueries.all() });
      qc.invalidateQueries({ queryKey: projectQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      teamApi.update(id, { name }),
    onSuccess: () => {
      toast.success(t("toasts.teamUpdated"));
      qc.invalidateQueries({ queryKey: teamQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.teamDeleted"));
      qc.invalidateQueries({ queryKey: teamQueries.all() });
      qc.invalidateQueries({ queryKey: projectQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Team-member mutations ---------------------------------------------------
export function useCreateTeamMember(teamId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (input: TeamMemberCreateInput) => teamMemberApi.create(teamId, input),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberAdded"));
      qc.invalidateQueries({ queryKey: teamMemberQueries.all() });
      qc.invalidateQueries({ queryKey: teamQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TeamMemberFormValues> }) =>
      teamMemberApi.update(id, input),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberUpdated"));
      qc.invalidateQueries({ queryKey: teamMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => teamMemberApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.teamMemberRemoved"));
      qc.invalidateQueries({ queryKey: teamMemberQueries.all() });
      qc.invalidateQueries({ queryKey: teamQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

// --- Project-member mutations ------------------------------------------------
export function useCreateProjectMember(projectId: string) {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (companyMemberId: string) =>
      projectMemberApi.create(projectId, companyMemberId),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberAdded"));
      qc.invalidateQueries({ queryKey: projectMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProjectMember() {
  const qc = useQueryClient();
  const t = useTranslations("organization");
  return useMutation({
    mutationFn: (id: string) => projectMemberApi.remove(id),
    onSuccess: () => {
      toast.success(t("toasts.projectMemberRemoved"));
      qc.invalidateQueries({ queryKey: projectMemberQueries.all() });
    },
    onError: (error) => toast.error(error.message),
  });
}
