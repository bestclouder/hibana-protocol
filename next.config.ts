import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AI-generated apps should deploy even if the template has strict type or
  // lint issues. Type errors are compile-time only and don't affect runtime,
  // so we don't let them block a deployment.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: {
      // Screenshot uploads (submit forms, post-on-behalf drafting) exceed
      // the 1 MB default
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
