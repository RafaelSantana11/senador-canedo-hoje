"use client"

import { useQuery } from "@tanstack/react-query"
import { serveBanners } from "../services/banners-service"
import type { BannerPosition } from "../types/banner"

export const SERVE_BANNERS_KEY = ["banners", "serve"] as const

// Entrega pública do portal: mapa posição → itens ativos ([] quando vazio).
export function useServeBanners(positions?: BannerPosition[]) {
  return useQuery({
    queryKey: [...SERVE_BANNERS_KEY, positions ?? null],
    queryFn: () => serveBanners(positions),
  })
}
