import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { Toaster } from "@/shared/ui/sonner";
import { siteConfig } from "@/shared/config/site";
import { AppProviders } from "@/_app";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

/**
 * Re-applies saved appearance preferences (color preset, radius, density)
 * before hydration so there is no flash of the default theme. Must stay in
 * sync with PREFERENCES_STORAGE_KEY / defaults in stores/preferences-store.ts.
 */
const preferencesScript = `(function(){try{var s=JSON.parse(localStorage.getItem("ui-preferences")||"{}").state||{};var d=document.documentElement;if(s.preset&&s.preset!=="neutral")d.setAttribute("data-preset",s.preset);if(s.radius&&s.radius!=="lg")d.setAttribute("data-radius",s.radius);if(s.density&&s.density!=="comfortable")d.setAttribute("data-density",s.density);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            {children}
            <Toaster position="top-right" richColors />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
