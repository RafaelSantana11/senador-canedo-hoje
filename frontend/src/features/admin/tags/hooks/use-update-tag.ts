"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateTag } from "../services/tags-service"
import { TAGS_KEY } from "./use-tags"
import type { TagPayload } from "../types/tag"

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TagPayload> }) =>
      updateTag(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
    },
  })
}
