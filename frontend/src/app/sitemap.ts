import type { MetadataRoute } from "next"
import { getPublicNews } from "@/features/portal/home/services/news-service"
import { absoluteSiteUrl } from "@/lib/seo"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteSiteUrl(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ]

  try {
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const response = await getPublicNews({
        page,
        limit: 50,
        status: "published",
      })

      entries.push(
        ...response.data.map((article) => ({
          url: absoluteSiteUrl(`/noticia/${article.slug}`),
          lastModified: new Date(article.updatedAt),
          changeFrequency: "daily" as const,
          priority: 0.8,
        })),
      )

      hasNextPage = response.hasNextPage
      page += 1
    }
  } catch {
    // Keep the homepage available in the sitemap during an API outage.
  }

  return entries
}
