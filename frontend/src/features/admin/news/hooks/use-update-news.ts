"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateNews } from "../services/news-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { NEWS_KEY } from "./use-news"
import type { NewsPayload } from "../types/news"

export function useUpdateNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NewsPayload> }) =>
      updateNews(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWS_KEY })
      revalidatePortalCache(queryClient)
    },
  })
}
