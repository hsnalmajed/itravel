import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers can't run Next.js's built-in image optimizer
    // (it needs sharp, a native Node addon unavailable in the Workers
    // runtime). Serve /public images as-is instead of via /_next/image.
    unoptimized: true,
  },
};

export default nextConfig;
