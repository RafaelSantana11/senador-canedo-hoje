import { cache } from "react"
import { publicApi } from "@/services/api"
import type { NewsDetail, NewsListResponse } from "../types/news"

// Rotas públicas do portal via `publicApi` — sem token, a vitrine é sempre
// a visão anônima (só `published` volta).
//
// `cache()` deduplica dentro do mesmo request: `generateMetadata` e a página
// chamam este service duas vezes, mas o HTTP sai uma só — o que também evita
// contar `views` em dobro (o GET /news/:slug incrementa o contador).
export const getNewsBySlug = cache(async (slug: string): Promise<NewsDetail> => {
  const { data } = await publicApi.get<NewsDetail>(
    `news/${encodeURIComponent(slug)}`,
  )
  return data
})

/** Relacionadas: mesma categoria, teto pequeno — quem filtra é o cliente. */
export async function getRelatedNews(
  categorySlug: string,
  limit = 4,
): Promise<NewsListResponse> {
  const { data } = await publicApi.get<NewsListResponse>("news", {
    params: { category: categorySlug, page: 1, limit },
  })
  return data
}
