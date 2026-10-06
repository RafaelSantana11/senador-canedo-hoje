"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteTag } from "../services/tags-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { TAGS_KEY } from "./use-tags"

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      // Tags agora têm hub público (`/tag/[slug]`) e entram no sitemap.
      revalidatePortalCache(queryClient, ["tags"])
    },
  })
}
