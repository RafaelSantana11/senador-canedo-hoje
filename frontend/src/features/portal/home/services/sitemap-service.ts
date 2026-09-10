import { getPublicNews } from "./news-service"
import type { PublicNewsList } from "../types/news"

// O backend limita `limit` a 50 (news.controller.ts). Cada arquivo de sitemap
// cobre 100 páginas (5.000 URLs) — folgado frente ao teto de 50.000 do Google.
export const SITEMAP_PAGE_SIZE = 50
export const SITEMAP_PAGES_PER_FILE = 100

async function fetchPage(page: number): Promise<PublicNewsList | null> {
  try {
    return await getPublicNews({
      page,
      limit: SITEMAP_PAGE_SIZE,
      status: "published",
    })
  } catch {
    return null
  }
}

/**
 * Última página com notícias. A paginação é por offset (páginas cheias são
 * contíguas), então sonda exponencial + busca binária bastam: ~2·log(n)
 * requests em vez de varrer todas as páginas a cada regeneração.
 */
async function findLastPage(): Promise<number> {
  const first = await fetchPage(1)
  if (!first || first.data.length === 0) return 0
  if (!first.hasNextPage) return 1

  let low = 1
  let high = 2
  while (true) {
    const probe = await fetchPage(high)
    if (!probe) return low
    if (probe.data.length === 0) break
    if (!probe.hasNextPage) return high
    low = high
    high *= 2
  }

  let lo = low
  let hi = high - 1
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const probe = await fetchPage(mid)
    if (probe && probe.data.length > 0) lo = mid
    else hi = mid - 1
  }

  return lo
}

export async function getSitemapIds(): Promise<number[]> {
  const lastPage = await findLastPage()
  const fileCount = Math.max(1, Math.ceil(lastPage / SITEMAP_PAGES_PER_FILE))
  return Array.from({ length: fileCount }, (_, id) => id)
}

export async function getArticlesForSitemapFile(
  id: number
): Promise<PublicNewsList["data"]> {
  const firstPage = id * SITEMAP_PAGES_PER_FILE + 1
  const lastPage = firstPage + SITEMAP_PAGES_PER_FILE - 1
  const articles: PublicNewsList["data"] = []

  for (let page = firstPage; page <= lastPage; page++) {
    const response = await fetchPage(page)
    if (!response) break

    articles.push(...response.data)
    if (!response.hasNextPage) break
  }

  return articles
}
