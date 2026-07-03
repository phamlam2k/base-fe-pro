import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { OrdersView } from "@/features/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("title") };
}

export default async function OrdersPage() {
  const t = await getTranslations("orders");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {/* Suspense required: OrdersView reads useSearchParams (URL filters) */}
      <Suspense>
        <OrdersView />
      </Suspense>
    </div>
  );
}
