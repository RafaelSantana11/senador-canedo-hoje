import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { getPublicNews } from "@/features/portal/home/services/news-service"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"
import { SITE_CITY, SITE_REGION } from "@/lib/portal-params"
import { absoluteMediaUrl, absoluteSiteUrl } from "@/lib/seo"
import { escapeXml } from "@/lib/xml"

// Como o /sitemap-index.xml: pré-renderizado e revalidado a cada 5 min. O admin
// invalida na hora via /api/revalidate ao publicar/editar notícia — o feed é o
// canal que agregadores e crawlers de IA consultam para achar conteúdo novo.
export const revalidate = 300

/** Teto de itens por página no backend (news.controller) — 1 fetch basta. */
const FEED_MAX_ITEMS = 50

export async function GET() {
  const settings = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )

  const siteUrl = absoluteSiteUrl()
  const feedUrl = absoluteSiteUrl("/feed.xml")

  let items: string[] = []
  let lastBuildDate = new Date().toUTCString()

  try {
    const { data } = await getPublicNews({ page: 1, limit: FEED_MAX_ITEMS })

    if (data.length > 0) {
      const updatedAtTimes = data
        .map((article) => new Date(article.updatedAt).getTime())
        .filter(Number.isFinite)
      if (updatedAtTimes.length > 0) {
        lastBuildDate = new Date(Math.max(...updatedAtTimes)).toUTCString()
      }

      items = data.map((article) => {
        const url = absoluteSiteUrl(`/noticia/${article.slug}`)
        const description =
          article.summary?.trim() || generateExcerpt(article.body, 280)
        const pubDate = new Date(
          article.publishedAt ?? article.createdAt
        ).toUTCString()

        return [
          "    <item>",
          `      <title>${escapeXml(article.title)}</title>`,
          `      <link>${escapeXml(url)}</link>`,
          `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
          `      <pubDate>${pubDate}</pubDate>`,
          article.author?.name
            ? `      <dc:creator>${escapeXml(article.author.name)}</dc:creator>`
            : "",
          article.category?.name
            ? `      <category>${escapeXml(article.category.name)}</category>`
            : "",
          `      <description>${escapeXml(description)}</description>`,
          article.cover?.path
            ? `      <media:content url="${escapeXml(absoluteMediaUrl(article.cover.path))}" medium="image" />`
            : "",
          "    </item>",
        ]
          .filter(Boolean)
          .join("\n")
      })
    }
  } catch {
    // Feed degrada para vazio: falha de rede não pode derrubar a rota.
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">`,
    `  <channel>`,
    `    <title>${escapeXml(settings.SITE_NAME)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${escapeXml(
      `Notícias de ${SITE_CITY} (${SITE_REGION}): política, economia, esportes, cultura e serviços — atualizado diariamente.`
    )}</description>`,
    `    <language>pt-BR</language>`,
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...items,
    `  </channel>`,
    `</rss>`,
    "",
  ].join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate",
    },
  })
}
