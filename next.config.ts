import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Reads src/i18n/request.ts for locale resolution.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
