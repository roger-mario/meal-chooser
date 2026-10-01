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
    // Photos from private Blob stores are served by /api/images (public, like shared meals).
    localPatterns: [{ pathname: "/api/images/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    // Photo URLs never change (a new photo gets a new URL), so resized versions can be kept for long.
    minimumCacheTTL: 31 * 24 * 60 * 60,
  },
};

export default nextConfig;
