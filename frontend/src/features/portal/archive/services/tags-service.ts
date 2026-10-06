import { publicApi } from "@/services/api"
import { TAGS_FETCH_LIMIT } from "@/lib/portal-params"
import type { PublicTagList } from "../types/tag"

// Rota pública do portal (GET /api/v1/tags): sem token, paginada. O portal de
// notícias tem poucas tags, então uma página única basta para achar por slug.
export async function getPublicTags(): Promise<PublicTagList> {
  const { data } = await publicApi.get<PublicTagList>("tags", {
    params: { page: 1, limit: TAGS_FETCH_LIMIT },
  })
  return data
}
