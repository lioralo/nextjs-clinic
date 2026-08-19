import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Prevent Turbopack from inferring the wrong workspace root (multiple lockfiles).
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
