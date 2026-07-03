import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { OrderDetailView } from "@/features/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("detailTitle") };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
