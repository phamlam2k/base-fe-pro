import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Reads the next-intl request config (moved under the FSD shared/config layer).
const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
