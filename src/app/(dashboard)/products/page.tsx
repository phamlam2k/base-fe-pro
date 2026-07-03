import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { ProductsView } from "@/features/products";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  return { title: t("title") };
}

export default async function ProductsPage() {
  const t = await getTranslations("products");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {/* Suspense required: ProductsView reads useSearchParams (URL filters) */}
      <Suspense>
        <ProductsView />
      </Suspense>
    </div>
  );
}
