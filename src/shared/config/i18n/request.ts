import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/shared/config/i18n/config";

/**
 * Cookie-based locale resolution (no locale URL prefix). This suits
 * dashboards/back-offices; for SEO-facing sites switch to next-intl's
 * routing-based setup — only this file and the locale switcher change.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Mọi ngày/giờ hiển thị (format.dateTime/relativeTime) LUÔN theo giờ Việt Nam,
    // độc lập múi giờ trình duyệt/máy chủ. NextIntlClientProvider tự kế thừa giá trị này.
    timeZone: "Asia/Ho_Chi_Minh",
  };
});
