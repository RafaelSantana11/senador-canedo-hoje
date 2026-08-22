"use client"

import { useQuery } from "@tanstack/react-query"
import { getBanners, type GetBannersParams } from "../services/banners-service"

export const BANNERS_KEY = ["banners"] as const

export function useBanners(params?: GetBannersParams) {
  return useQuery({
    queryKey: [...BANNERS_KEY, params ?? {}],
    queryFn: () => getBanners({ limit: 50, ...params }),
  })
}
