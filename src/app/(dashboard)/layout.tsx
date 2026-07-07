import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "@/widgets/app-header";
import { AppSidebar } from "@/widgets/app-sidebar";
import { ROUTES } from "@/shared/config/routes";
import { getCurrentUser } from "@/shared/lib/auth/session";
import { SessionProvider } from "@/entities/session";

/**
 * Protected shell. The proxy already blocks unauthenticated requests, but we
 * re-check here (defense in depth) and resolve the user server-side once so
 * every client component can read it from context without a fetch.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  return (
    <SessionProvider user={user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
