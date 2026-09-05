import type { Metadata } from "next"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  noop,
} from "@tanstack/react-query"
import HomePage from "@/features/portal/home/pages/home-page"
import { infiniteNewsOptions } from "@/features/portal/home/services/news-infinite-options"
import { absoluteSiteUrl } from "@/lib/seo"

// ISR: a primeira página é pré-renderizada/cacheada por 60s. As páginas
// seguintes (infinite scroll) carregam no client via useInfiniteQuery.
export const revalidate = 60

export const metadata: Metadata = {
  title: "Senador Canedo Hoje — Notícias em tempo real",
  description:
    "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
  alternates: {
    canonical: absoluteSiteUrl(),
  },
  openGraph: {
    type: "website",
    title: "Senador Canedo Hoje — Notícias em tempo real",
    description:
      "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
    url: absoluteSiteUrl(),
  },
}

export default async function PortalHomePage() {
  // Prefetch da primeira página no servidor para hidratar o cache do client sem
  // re-fetch no mount. `.catch(noop)` evita que um erro de rede abaixo a página.
  const queryClient = new QueryClient()
  await queryClient.prefetchInfiniteQuery(infiniteNewsOptions()).catch(noop)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  )
}
