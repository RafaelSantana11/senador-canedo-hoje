import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  noop,
} from "@tanstack/react-query"
import HomePage from "@/features/portal/home/pages/home-page"
import { infiniteNewsOptions } from "@/features/portal/home/services/news-infinite-options"
import { portalCategoriesOptions } from "@/features/portal/home/services/categories-options"
import { serveBannersOptions } from "@/features/portal/home/services/banners-options"
import {
  getCachedPublicCategories,
  getCachedServeBanners,
} from "@/features/portal/home/services/portal-cache"

// ISR: a 1ª página do feed é cacheada por 60s. Categorias e banners usam cache
// próprio de 5 min (`portal-cache.ts`), então regenerar o HTML a cada minuto
// não refaz essas chamadas. As páginas seguintes do feed (infinite scroll)
// carregam no client via useInfiniteQuery. O admin invalida na hora via
// /api/revalidate ao criar/editar notícia, categoria ou banner.
export const revalidate = 60

export default async function PortalHomePage() {
  // Hidrata o cache do client sem re-fetch no mount. Cada prefetch tem seu
  // próprio `.catch(noop)` para uma falha de rede não derrubar os demais.
  const queryClient = new QueryClient()
  await Promise.allSettled([
    queryClient.prefetchInfiniteQuery(infiniteNewsOptions()).catch(noop),
    queryClient
      .prefetchQuery(portalCategoriesOptions(getCachedPublicCategories))
      .catch(noop),
    queryClient
      .prefetchQuery(serveBannersOptions(undefined, getCachedServeBanners))
      .catch(noop),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
