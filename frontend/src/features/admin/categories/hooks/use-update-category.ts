"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCategory } from "../services/categories-service"
import { CATEGORIES_KEY } from "./use-categories"
import type { CategoryPayload } from "../types/category"

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    },
  })
}
