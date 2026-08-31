import { getPublicNews } from "./news-service"
import type { GetPublicNewsParams, PublicNewsList } from "../types/news"

// Opções "puras" da query infinita da vitrine — sem diretiva "use client" para
// poderem ser usadas tanto no prefetch (Server Component) quanto no hook
// (client). Compartilhar aqui garante queryKey idêntica nos dois lados.
export const INFINITE_NEWS_KEY = ["portal", "news", "infinite"] as const

export const FEED_INITIAL_PAGE = 1
export const FEED_PAGE_LIMIT = 20

export type PublicNewsParams = GetPublicNewsParams

export function infiniteNewsOptions(params: PublicNewsParams = {}) {
  const merged: PublicNewsParams = {
    page: FEED_INITIAL_PAGE,
    limit: FEED_PAGE_LIMIT,
    status: "published",
    ...params,
  }

  return {
    queryKey: [...INFINITE_NEWS_KEY, merged] as const,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getPublicNews({ ...merged, page: pageParam }),
    initialPageParam: FEED_INITIAL_PAGE,
    getNextPageParam: (
      lastPage: PublicNewsList,
      _allPages: PublicNewsList[],
      lastPageParam: number,
    ) => (lastPage?.hasNextPage ? lastPageParam + 1 : undefined),
  }
}
