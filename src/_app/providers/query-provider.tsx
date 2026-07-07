"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { makeQueryClient } from "@/shared/api/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState (not useMemo) guarantees a stable client across re-renders and
  // avoids sharing state between users when this ever runs on the server.
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
