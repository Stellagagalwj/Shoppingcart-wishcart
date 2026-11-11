import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "购物车",
    short_name: "购物车",
    description: "记下想买的东西，准备好时再去采购。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#f7f7fb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
