import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <FileQuestion className="text-muted-foreground size-12" />
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {t("notFoundDescription")}
      </p>
      <Button asChild>
        <Link href={ROUTES.dashboard}>{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
