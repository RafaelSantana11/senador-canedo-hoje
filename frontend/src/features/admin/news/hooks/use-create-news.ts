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
    onSuccess: (news) => {
      queryClient.invalidateQueries({ queryKey: NEWS_KEY })
      // `urls` avisa o IndexNow da URL exata; rascunho/arquivada não existe no
      // portal público, então só a publicada entra no ping.
      revalidatePortalCache(
        queryClient,
        undefined,
        news.status === "published" ? [`/noticia/${news.slug}`] : undefined
      )
    },
  })
}
