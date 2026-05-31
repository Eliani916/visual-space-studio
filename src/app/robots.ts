import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/fotografer/",
        "/dashboard/",
        "/api/",
      ],
    },
    sitemap: "https://visual-space-nine.vercel.app/sitemap.xml",
  };
}
