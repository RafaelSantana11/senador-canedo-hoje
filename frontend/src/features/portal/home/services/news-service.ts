import { api } from "@/services/api"
import type { GetPublicNewsParams, PublicNewsList } from "../types/news"

// Rota pública do portal (GET /api/v1/news). `category` e `tag` recebem slug,
// não id. Sem token, `?status=` é ignorado e só `published` volta — o filtro
// do lado do cliente cobre quem navega logado (o interceptor anexa token).
export async function getPublicNews(
  params?: GetPublicNewsParams,
): Promise<PublicNewsList> {
  const { data } = await api.get<PublicNewsList>("news", { params })
  return data
}
