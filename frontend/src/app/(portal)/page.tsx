import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  noop,
  type InfiniteData,
} from "@tanstack/react-query"
import HomePage from "@/features/portal/home/pages/home-page"
import { infiniteNewsOptions } from "@/features/portal/home/services/news-infinite-options"
import { newsViewsOptions } from "@/features/portal/home/services/news-views-options"
import { portalCategoriesOptions } from "@/features/portal/home/services/categories-options"
import { serveBannersOptions } from "@/features/portal/home/services/banners-options"
import {
  getCachedPublicCategories,
  getCachedServeBanners,
} from "@/features/portal/home/services/portal-cache"
import type { PublicNewsList } from "@/features/portal/home/types/news"

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
  const feedOptions = infiniteNewsOptions()

  await Promise.allSettled([
    queryClient.prefetchInfiniteQuery(feedOptions).catch(noop),
    queryClient
      .prefetchQuery(portalCategoriesOptions(getCachedPublicCategories))
      .catch(noop),
    queryClient
      .prefetchQuery(serveBannersOptions(undefined, getCachedServeBanners))
      .catch(noop),
  ])

  // "Mais lidas" com a contagem atual: o `views` da listagem é o retrato do
  // momento em que ela foi gerada e congela junto com o cache. As candidatas
  // são as notícias da 1ª página, então esta query depende do prefetch acima —
  // o HTML já sai na ordem certa e o `staleTime` de 5 min evita um refetch no
  // mount que reordenaria a seção depois do primeiro paint.
  const feed = queryClient.getQueryData<InfiniteData<PublicNewsList>>(
    feedOptions.queryKey,
  )
  const viewIds = feed?.pages[0]?.data.map((news) => news.id) ?? []
  await queryClient.prefetchQuery(newsViewsOptions(viewIds)).catch(noop)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
