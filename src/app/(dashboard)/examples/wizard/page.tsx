import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { FeatureGate } from "@/components/shared/feature-gate";
import { CampaignWizard } from "@/features/examples";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wizard");
  return { title: t("title") };
}

export default async function WizardExamplePage() {
  const t = await getTranslations("wizard");

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <FeatureGate flag="wizardExample">
        <CampaignWizard />
      </FeatureGate>
    </div>
  );
}
