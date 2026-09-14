import { unstable_cache } from "next/cache"
import { getPublicCategories } from "./categories-service"
import { serveBanners } from "./banners-service"

// Dados do portal que mudam pouco (menu e banners) têm cache próprio de 5 min,
// independente do `revalidate` da rota. A home regenera o HTML a cada 60 s para
// as notícias, mas só refaz estas chamadas quando o TTL vence — ou na hora,
// quando o /api/revalidate invalida o caminho (as tags implícitas da rota
// cobrem estes entries).
//
// Arquivo server-only: `unstable_cache` não pode ser importado no client; quem
// consome são os Server Components (ex.: prefetch da home).
export const getCachedPublicCategories = unstable_cache(
  () => getPublicCategories({ page: 1, limit: 100, active: true }),
  ["portal-categories"],
  { revalidate: 300, tags: ["portal:categories"] },
)

export const getCachedServeBanners = unstable_cache(
  () => serveBanners(),
  ["portal-banners"],
  { revalidate: 300, tags: ["portal:banners"] },
)
