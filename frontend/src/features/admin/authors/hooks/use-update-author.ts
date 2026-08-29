"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAuthor } from "../services/authors-service"
import { AUTHORS_KEY } from "./use-authors"
import type { UpdateAuthorPayload } from "../types/author"

export function useUpdateAuthor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAuthorPayload }) =>
      updateAuthor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORS_KEY })
    },
  })
}
