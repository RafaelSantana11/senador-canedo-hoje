"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateNews } from "../services/news-service"
import { NEWS_KEY } from "./use-news"
import type { NewsPayload } from "../types/news"

export type NewsPatch = {
  id: string
  payload: Partial<NewsPayload>
}

export function useUpdateNewsPosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patches: NewsPatch[]) =>
      Promise.all(patches.map((p) => updateNews(p.id, p.payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEWS_KEY })
    },
  })
}
