import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FarmFlows — Farm management",
    short_name: "FarmFlows",
    description: "Cattle, dairy and layer farm management. গবাদিপশু, দুধ ও ডিমপাড়া মুরগির খামার ব্যবস্থাপনা।",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#16a34a",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Quick entry / দ্রুত এন্ট্রি", url: "/dashboard/quick", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Milk / দুধ", url: "/dashboard/milk", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Cattle / গবাদিপশু", url: "/dashboard/cattle", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Health / স্বাস্থ্য", url: "/dashboard/health", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
