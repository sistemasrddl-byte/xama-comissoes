import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XAMA Comissões",
    short_name: "XAMA",
    description: "Sistema de gestão de comissões",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#f97316",
    orientation: "portrait-primary",
    lang: "pt-BR",
    scope: "/",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}