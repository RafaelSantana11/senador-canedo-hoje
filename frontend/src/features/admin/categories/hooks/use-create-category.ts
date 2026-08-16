"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCategory } from "../services/categories-service"
import { CATEGORIES_KEY } from "./use-categories"
import type { CategoryPayload } from "../types/category"

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    },
  })
}
