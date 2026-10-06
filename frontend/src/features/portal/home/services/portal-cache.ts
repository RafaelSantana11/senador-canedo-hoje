import { unstable_cache } from "next/cache"
import { getPublicCategories } from "./categories-service"
import { serveBanners } from "./banners-service"
import { getPublicNews } from "./news-service"
import { getPublicSettings } from "@/features/portal/settings/services/settings-service"
import { getPublicTags } from "@/features/portal/archive/services/tags-service"
import { ARCHIVE_PAGE_SIZE } from "@/lib/portal-params"

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
  { revalidate: 300, tags: ["portal:settings"] }
)

export const getCachedPublicCategories = unstable_cache(
  () => getPublicCategories({ page: 1, limit: 100, active: true }),
  ["portal-categories"],
  { revalidate: 300, tags: ["portal:categories"] }
)

export const getCachedPublicTags = unstable_cache(
  () => getPublicTags(),
  ["portal-tags"],
  { revalidate: 300, tags: ["portal:tags"] }
)

export const getCachedServeBanners = unstable_cache(
  () => serveBanners(),
  ["portal-banners"],
  { revalidate: 300, tags: ["portal:banners"] }
)

// Listagens dos hubs de categoria/tag: as páginas leem `searchParams` (página
// atual) e renderizam por request, então o cache de 5 min por slug+página
// segura a chamada ao backend. `category`/`tag` nulos não entram na query —
// cada combinação vira uma chave própria do cache.
export const getCachedArchiveNews = unstable_cache(
  (category: string | null, tag: string | null, page: number) =>
    getPublicNews({
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
      page,
      limit: ARCHIVE_PAGE_SIZE,
    }),
  ["portal-archive-news"],
  { revalidate: 300, tags: ["portal:archive-news"] }
)
