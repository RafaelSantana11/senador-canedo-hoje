import { publicApi } from "@/services/api"
import type { GetPublicNewsParams, PublicNewsList } from "../types/news"

// Rota pública do portal (GET /api/v1/news). `category` e `tag` recebem slug,
// não id. O `publicApi` não anexa token: a vitrine é sempre a visão anônima —
// só `published` volta, mesmo para quem está logado no painel.
export async function getPublicNews(
  params?: GetPublicNewsParams,
): Promise<PublicNewsList> {
  const { data } = await publicApi.get<PublicNewsList>("news", { params })
  return data
}
