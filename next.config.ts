import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',   // Produces a self-contained build for Docker
  serverExternalPackages: [
    '@remotion/renderer',
    '@remotion/bundler'
  ],
};

export default nextConfig;
