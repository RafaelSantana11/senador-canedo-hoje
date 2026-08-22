"use client"

import { useQuery } from "@tanstack/react-query"
import { getBannerById } from "../services/banners-service"
import { BANNERS_KEY } from "./use-banners"

export function useBanner(id?: string) {
  return useQuery({
    queryKey: [...BANNERS_KEY, "detail", id],
    queryFn: () => getBannerById(id!),
    enabled: Boolean(id),
  })
}
