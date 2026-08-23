"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicNews } from "../services/news-service"
import type { GetPublicNewsParams } from "../types/news"

export const PORTAL_NEWS_KEY = ["portal", "news"] as const

// Default da vitrine: 1 página de 50 (teto do servidor) já cobre todas as
// seções da home. Chamadas sem params compartilham a mesma entrada de cache.
export const SHOWCASE_PARAMS: GetPublicNewsParams = {
  page: 1,
  limit: 50,
  status: "published",
}

export function usePortalNews(params: GetPublicNewsParams = SHOWCASE_PARAMS) {
  return useQuery({
    queryKey: [...PORTAL_NEWS_KEY, params],
    queryFn: () => getPublicNews(params),
  })
}
