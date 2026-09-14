"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createNews } from "../services/news-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { NEWS_KEY } from "./use-news"
import type { NewsPayload } from "../types/news"

export function useCreateNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NewsPayload) => createNews(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWS_KEY })
      revalidatePortalCache(queryClient)
    },
  })
}
