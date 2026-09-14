"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteNews } from "../services/news-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { NEWS_KEY } from "./use-news"

export function useDeleteNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWS_KEY })
      revalidatePortalCache(queryClient)
    },
  })
}
