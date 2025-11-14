import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore .devcontainer symlink
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/.devcontainer/**", "**/node_modules/**"],
    };
    return config;
  },
  // For Turbopack (Next.js 13+)
  experimental: {
    turbo: {
      resolveAlias: {},
      rules: {},
    },
  },
};

export default nextConfig;
