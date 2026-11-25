import { ShieldX } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import { ROUTES, defaultLandingFor } from "@/shared/config/routes";
import { getCurrentUser } from "@/shared/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forbiddenTitle") };
}

export async function ForbiddenPage() {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const user = await getCurrentUser();
  const home = user ? defaultLandingFor(user.role) : ROUTES.login;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldX className="text-muted-foreground size-12" />
      <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {t("forbiddenDescription")}
      </p>
      <Button asChild>
        <Link href={home}>{tCommon("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
