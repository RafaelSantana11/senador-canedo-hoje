import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { getPublicNews } from "@/features/portal/home/services/news-service"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"
import type { PublicNews } from "@/features/portal/home/types/news"
import { absoluteSiteUrl } from "@/lib/seo"
import { escapeXml } from "@/lib/xml"

// News sitemap do Google (namespace `news`): somente matérias das últimas 48 h,
// que é o que o formato aceita. É o sinal de frescor que Google News e AI
// Overviews usam para descobrir cobertura nova — referenciado no robots.txt.
export const revalidate = 300

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000
/** Teto do formato: 1.000 URLs por arquivo. */
const MAX_URLS = 1000
/** Teto do backend: 50 por página. */
const PAGE_SIZE = 50
const MAX_PAGES = Math.ceil(MAX_URLS / PAGE_SIZE)

export async function GET() {
  const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )

  const cutoff = Date.now() - NEWS_WINDOW_MS
  const articles: PublicNews[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await getPublicNews({ page, limit: PAGE_SIZE }).catch(
      () => null
    )
    if (!response || response.data.length === 0) break

    const recent = response.data.filter((article) => {
      const published = new Date(
        article.publishedAt ?? article.createdAt
      ).getTime()
      return Number.isFinite(published) && published >= cutoff
    })

    articles.push(...recent)
    if (articles.length >= MAX_URLS) break

    // Página inteiramente fora da janela: o restante da listagem é mais antigo
    // (ela vem da mais nova para a mais antiga), então dá para parar aqui.
    if (recent.length === 0 && page > 1) break
    if (!response.hasNextPage) break
  }

  const urls = articles
    .slice(0, MAX_URLS)
    .map((article) => {
      const loc = escapeXml(absoluteSiteUrl(`/noticia/${article.slug}`))
      const publicationDate = new Date(
        article.publishedAt ?? article.createdAt
      ).toISOString()
      const keywords =
        article.tags.length > 0
          ? `      <news:keywords>${escapeXml(article.tags.map((tag) => tag.name).join(", "))}</news:keywords>\n`
          : ""

      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${escapeXml(siteName)}</news:name>`,
        "        <news:language>pt-BR</news:language>",
        "      </news:publication>",
        `      <news:publication_date>${publicationDate}</news:publication_date>`,
        `      <news:title>${escapeXml(article.title)}</news:title>`,
        keywords.trimEnd(),
        "    </news:news>",
        "  </url>",
      ]
        .filter((line) => line.trim().length > 0)
        .join("\n")
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>\n`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate",
    },
  })
}
