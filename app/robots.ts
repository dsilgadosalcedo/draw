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

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: {
      userAgent: "*",
      disallow: "/"
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString()
  }
}
