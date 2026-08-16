"use client"

import { useQuery } from "@tanstack/react-query"
import { getNewsBySlug } from "../services/news-service"
import { NEWS_KEY } from "./use-news"

export function useNewsBySlug(slug: string | null) {
  return useQuery({
    queryKey: [...NEWS_KEY, "slug", slug],
    queryFn: () => getNewsBySlug(slug as string),
    enabled: Boolean(slug),
  })
}
