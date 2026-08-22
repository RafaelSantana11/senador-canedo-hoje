import { api } from "@/services/api"
import type {
  Banner,
  BannerPayload,
  BannerPosition,
  BannerRoot,
  ServeBannersResponse,
} from "../types/banner"

export type GetBannersParams = {
  page?: number
  limit?: number
  position?: BannerPosition
  active?: boolean
}

export async function getBanners(params?: GetBannersParams): Promise<BannerRoot> {
  const { data } = await api.get<BannerRoot>("banners", { params })
  return data
}

export async function getBannerById(id: string): Promise<Banner> {
  const { data } = await api.get<Banner>(`banners/${id}`)
  return data
}

// Itens são aninhados no payload; PATCH com `items` substitui a lista inteira.
export async function createBanner(payload: BannerPayload): Promise<Banner> {
  const { data } = await api.post<Banner>("banners", payload)
  return data
}

export async function updateBanner(
  id: string,
  payload: Partial<BannerPayload>,
): Promise<Banner> {
  const { data } = await api.patch<Banner>(`banners/${id}`, payload)
  return data
}

// Apaga a campanha e os itens; os arquivos permanecem no acervo.
export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`banners/${id}`)
}

// Rota pública do portal. Posição vazia devolve [], nunca 404.
export async function serveBanners(
  positions?: BannerPosition[],
): Promise<ServeBannersResponse> {
  const { data } = await api.get<ServeBannersResponse>("banners/serve", {
    params: positions?.length ? { positions: positions.join(",") } : undefined,
  })
  return data
}
