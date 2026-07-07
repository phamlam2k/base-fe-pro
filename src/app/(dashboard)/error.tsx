"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

/** Segment error boundary: keeps the shell alive, offers a retry. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  React.useEffect(() => {
    // Report to your observability tool (Sentry, Datadog...) here.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <TriangleAlert className="text-destructive size-10" />
      <h2 className="text-xl font-semibold">{t("somethingWentWrong")}</h2>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
