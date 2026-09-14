import { serveBanners } from "./banners-service"
import type { BannerPosition, ServeBannersResponse } from "../types/banner"

// Opções "puras" da entrega de banners — sem diretiva "use client" para
// servirem ao prefetch do Server Component (home) e ao hook no client.
// Compartilhar aqui garante queryKey idêntica nos dois lados, então o
// HydrationBoundary hidrata sem refetch no mount.
export const SERVE_BANNERS_KEY = ["banners", "serve"] as const

// Entrega pública do portal: mapa posição → itens ativos ([] quando vazio).
//
// O `queryFn` é injetável para o servidor trocar a chamada direta pelo cache de
// 5 min (`getCachedServeBanners`), sem mudar a queryKey.
export function serveBannersOptions(
  positions?: BannerPosition[],
  queryFn: () => Promise<ServeBannersResponse> = () => serveBanners(positions),
) {
  return {
    queryKey: [...SERVE_BANNERS_KEY, positions ?? null] as const,
    queryFn,
  }
}
