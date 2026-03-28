import type { MetadataRoute } from "next"

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl
  }

  return `https://${siteUrl}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()

  return [
    {
      url: new URL("/", baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.1
    }
  ]
}
