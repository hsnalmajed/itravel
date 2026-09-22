import type { MetadataRoute } from "next";

/**
 * What a phone calls the site when someone saves it to their home screen.
 *
 * This is the first step toward the app: an installed web app appears under
 * this name and icon, and the same name and icon are what a store listing
 * will use later. Both spellings are in the full name so the saved icon
 * reads correctly for an Arabic or an English phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sfrtna — سفرتنا",
    short_name: "Sfrtna",
    description: "لكل سفرة حكاية — Every trip has a story",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2d5b",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
