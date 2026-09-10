import type { MetadataRoute } from "next"
import {
  getArticlesForSitemapFile,
  getSitemapIds,
} from "@/features/portal/home/services/sitemap-service"
import { absoluteSiteUrl } from "@/lib/seo"

export const revalidate = 3600

export async function generateSitemaps() {
  const ids = await getSitemapIds()
  return ids.map((id) => ({ id }))
}

export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)

  const entries: MetadataRoute.Sitemap = []

  if (id === 0) {
    entries.push({
      url: absoluteSiteUrl(),
      changeFrequency: "hourly",
      priority: 1,
    })
  }

  const articles = await getArticlesForSitemapFile(id)
  entries.push(
    ...articles.map((article) => ({
      url: absoluteSiteUrl(`/noticia/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))
  )

  return entries
}
