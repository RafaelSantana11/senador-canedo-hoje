"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteTag } from "../services/tags-service"
import { TAGS_KEY } from "./use-tags"

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY })
    },
  })
}
