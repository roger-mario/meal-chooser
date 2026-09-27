import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photos are resized in the browser before upload; this leaves headroom.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
