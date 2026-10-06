import type { MetadataRoute } from "next"
import {
  getArticlesForSitemapFile,
  getSitemapIds,
} from "@/features/portal/home/services/sitemap-service"
import { getPublicCategories } from "@/features/portal/home/services/categories-service"
import { getPublicTags } from "@/features/portal/archive/services/tags-service"
import { categoryPath, tagPath } from "@/features/portal/archive/utils/paths"
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

    // Hubs editoriais entram no mesmo arquivo da home: categoria sempre; tag
    // só quando tem notícia publicada (hub vazio não deve ser descoberto).
    // Chamada direta (sem `unstable_cache`) de propósito: o cache de 5 min
    // derrubaria o revalidate de 1 h deste arquivo, e regenerá-lo custa até
    // 100 requests (5.000 URLs). API indisponível apenas omite os hubs.
    const [categories, tags] = await Promise.all([
      getPublicCategories({ page: 1, limit: 100, active: true }).catch(
        () => null
      ),
      getPublicTags().catch(() => null),
    ])

    for (const category of categories?.data ?? []) {
      entries.push({
        url: absoluteSiteUrl(categoryPath(category.slug)),
        changeFrequency: "daily",
        priority: 0.6,
      })
    }

    for (const tag of tags?.data ?? []) {
      if ((tag.usageCount ?? 0) > 0) {
        entries.push({
          url: absoluteSiteUrl(tagPath(tag.slug)),
          changeFrequency: "weekly",
          priority: 0.5,
        })
      }
    }
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
