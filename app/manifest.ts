import type { MetadataRoute } from "next";

// Lets "Add to Home Screen" install the hub as a standalone app. On iPhone this
// matters for staying signed in: home-screen apps keep their saved login, while
// plain Safari bookmarks can have it wiped after a week without a visit.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Media Team Hub",
    short_name: "Media Hub",
    description: "Scheduling, livestream setup, troubleshooting, and checklists for the church media team.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101315",
    theme_color: "#101315",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
