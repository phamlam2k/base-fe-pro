"use client";

import { useQuery } from "@tanstack/react-query";

import { userQueries } from "@/entities/user";

/** Debounced server-side lookup of existing user accounts (for the picker). */
export function useUserLookup(search: string) {
  return useQuery(userQueries.lookup(search));
}
