import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";

/**
 * Web app manifest: lets phones, tablets and smart-TV browsers add the site
 * to a home screen with its own name, icon and dark splash colour.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#090909",
    theme_color: "#090909",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
