"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { projectQueries } from "@/entities/project";
import { teamApi, teamQueries, type TeamFormValues } from "@/entities/team";
import {
  teamMemberApi,
  teamMemberQueries,
  type TeamMemberCreateInput,
  type TeamMemberFormValues,
} from "@/entities/team-member";

// --- Team --------------------------------------------------------------------
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

// --- Team member -------------------------------------------------------------
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
