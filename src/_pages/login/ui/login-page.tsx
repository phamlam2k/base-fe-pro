import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/features/auth-by-credentials";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
      {/* Suspense required: LoginForm reads useSearchParams for ?redirect */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
