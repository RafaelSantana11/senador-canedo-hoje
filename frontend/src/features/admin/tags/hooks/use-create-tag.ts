"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createTag } from "../services/tags-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { TAGS_KEY } from "./use-tags"
import type { TagPayload } from "../types/tag"

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TagPayload) => createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      // Tags agora têm hub público (`/tag/[slug]`) e entram no sitemap.
      revalidatePortalCache(queryClient, ["tags"])
    },
  })
}
