"use client"

import { useQuery } from "@tanstack/react-query"
import {
  SERVE_BANNERS_KEY,
  serveBannersOptions,
} from "../services/banners-options"
import type { BannerPosition } from "../types/banner"

export { SERVE_BANNERS_KEY }

// Entrega pública do portal: mapa posição → itens ativos ([] quando vazio).
// Prefetch SSR na home e na notícia; o staleTime acompanha o cache de 5 min do
// servidor para navegações SPA não refazerem a chamada no browser.
export function useServeBanners(positions?: BannerPosition[]) {
  return useQuery({
    ...serveBannersOptions(positions),
    staleTime: 5 * 60_000,
  })
}
