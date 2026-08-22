"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateBanner } from "../services/banners-service"
import { BANNERS_KEY } from "./use-banners"
import type { BannerPayload } from "../types/banner"

export function useUpdateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BannerPayload> }) =>
      updateBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNERS_KEY })
    },
  })
}
