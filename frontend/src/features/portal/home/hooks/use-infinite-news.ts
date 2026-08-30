"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import {
  infiniteNewsOptions,
  type PublicNewsParams,
} from "../services/news-infinite-options"

export {
  INFINITE_NEWS_KEY,
  FEED_INITIAL_PAGE,
  FEED_PAGE_LIMIT,
  infiniteNewsOptions,
} from "../services/news-infinite-options"
export type { PublicNewsParams } from "../services/news-infinite-options"

export function useInfinitePortalNews(params: PublicNewsParams = {}) {
  return useInfiniteQuery({
    ...infiniteNewsOptions(params),
    staleTime: 60_000,
  })
}
