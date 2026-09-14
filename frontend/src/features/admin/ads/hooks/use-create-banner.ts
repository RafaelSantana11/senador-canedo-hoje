"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createBanner } from "../services/banners-service"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { BANNERS_KEY } from "./use-banners"
import type { BannerPayload } from "../types/banner"

export function useCreateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BannerPayload) => createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANNERS_KEY })
      revalidatePortalCache(queryClient)
    },
  })
}
