import { unstable_cache } from "next/cache"
import { getPublicCategories } from "./categories-service"
import { serveBanners } from "./banners-service"
import { getPublicSettings } from "@/features/portal/settings/services/settings-service"

// Dados do portal que mudam pouco (parâmetros, menu e banners) têm cache
// próprio de 5 min, independente do `revalidate` da rota. A home regenera o
// HTML a cada 60 s para as notícias, mas só refaz estas chamadas quando o TTL
// vence — ou na hora, quando o /api/revalidate invalida a tag do recurso
// (`revalidateTag`) e as tags implícitas da rota.
//
// Arquivo server-only: `unstable_cache` não pode ser importado no client; quem
// consome são os Server Components (root layout e prefetch da home).
export const getCachedPublicSettings = unstable_cache(
  () => getPublicSettings(),
  ["portal-settings"],
  { revalidate: 300, tags: ["portal:settings"] },
)

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
