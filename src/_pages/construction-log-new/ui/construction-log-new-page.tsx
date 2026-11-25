import { redirect } from "next/navigation";

import { ROUTES } from "@/shared/config/routes";
import { canAccessAcceptance } from "@/shared/config/acceptance-access";
import { getCurrentUser } from "@/shared/lib/auth/session";
import { CreateLogForm } from "@/features/manage-construction-log";

export async function ConstructionLogNewPage() {
  // Chốt server-side: chỉ NT/Admin mới khai báo nhật ký.
  const user = await getCurrentUser();
  if (!user || !canAccessAcceptance(user.role, user.madokaRole, "create")) {
    redirect(ROUTES.constructionLogs);
  }
  return (
    <div className="mx-auto max-w-3xl">
      <CreateLogForm />
    </div>
  );
}
