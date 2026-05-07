import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',   // Produces a self-contained build for Docker
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/renderer',
      '@remotion/bundler'
    ],
  },
};

export default nextConfig;
