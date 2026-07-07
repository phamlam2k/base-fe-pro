import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/shared/config/i18n/messages/en.json";
import { TooltipProvider } from "@/shared/ui/tooltip";
import {
  SessionProvider,
  type SessionUser,
} from "@/entities/session";
import { buildSessionUser } from "@/test/factories";

/**
 * Custom render that wraps components with the app's real providers
 * (i18n, react-query, session). Always import { renderWithProviders }
 * from here instead of RTL's render.
 */
interface ProviderRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** Session user driving permission checks. Defaults to an admin. */
  sessionUser?: SessionUser;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // No retries in tests — a failing request should fail the test fast.
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  { sessionUser = buildSessionUser(), ...options }: ProviderRenderOptions = {},
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SessionProvider user={sessionUser}>{children}</SessionProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    );
  }

  return {
    // userEvent instance shares the test's fake/real timer configuration.
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export * from "@testing-library/react";
