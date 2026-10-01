import type { MetadataRoute } from "next";

/** Lets phones add Otao to the home screen as an app with its own icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Otao",
    short_name: "Otao",
    description: "Your favourite meals, categories, prices and nutrition.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
