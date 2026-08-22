"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteBanner } from "../services/banners-service"
import { BANNERS_KEY } from "./use-banners"

export function useDeleteBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNERS_KEY })
    },
  })
}
