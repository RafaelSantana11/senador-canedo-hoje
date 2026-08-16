"use client"

import { useQuery } from "@tanstack/react-query"
import { getNews } from "../services/news-service"
import type { GetNewsParams } from "../services/news-service"

export const NEWS_KEY = ["news"] as const

export function useNews(params?: GetNewsParams) {
  return useQuery({
    queryKey: [...NEWS_KEY, params],
    queryFn: () => getNews(params),
  })
}
