import { ConstructionLogDetailPage } from "@/_pages/construction-log-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConstructionLogDetailPage id={id} />;
}
