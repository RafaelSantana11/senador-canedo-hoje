"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCategory } from "../services/categories-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { CATEGORIES_KEY } from "./use-categories"

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      revalidatePortalCache(queryClient)
    },
  })
}
