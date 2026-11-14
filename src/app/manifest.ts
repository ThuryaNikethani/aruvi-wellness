import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARUVI",
    short_name: "ARUVI",
    description: "A gentler place for difficult days.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ee",
    theme_color: "#2f6f5b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
