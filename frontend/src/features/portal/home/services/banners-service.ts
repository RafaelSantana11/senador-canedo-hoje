import { publicApi } from "@/services/api"
import type { BannerPosition, ServeBannersResponse } from "../types/banner"

// Rota pública do portal (/api/v1/banners/serve). Posição vazia devolve [],
// nunca 404.
export async function serveBanners(
  positions?: BannerPosition[],
): Promise<ServeBannersResponse> {
  const { data } = await publicApi.get<ServeBannersResponse>("banners/serve", {
    params: positions?.length ? { positions: positions.join(",") } : undefined,
  })
  return data
}
