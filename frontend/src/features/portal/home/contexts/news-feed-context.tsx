"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import { useQuery } from "@tanstack/react-query"
import { useInfinitePortalNews } from "../hooks/use-infinite-news"
import {
  selectHomeSections,
  sortUrgentFirst,
  type HomeSections,
} from "../utils/showcase"
import { filterByQuery } from "../utils/filter-by-query"
import { newsViewsOptions } from "../services/news-views-options"
import type { PublicNews } from "../types/news"
import { useSelectedCategory } from "./category-context"
import { useSearch } from "./search-context"
import { usePortalSettings } from "@/features/portal/settings/hooks/use-portal-settings"

type NewsFeedContextValue = {
  /** Todas as notícias já carregadas (todas as páginas), filtradas por busca/categoria. */
  allNews: PublicNews[]
  /** Seções da home derivadas do acervo carregado. */
  sections: HomeSections
  /** Carrega a próxima página (chamado pelo sentinela de scroll ou pelo botão). */
  fetchNextPage: () => Promise<unknown>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetching: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  /** Número de páginas já carregadas (usado para atualizar ?page= na URL). */
  loadedPages: number
}

const NewsFeedContext = createContext<NewsFeedContextValue | null>(null)

export function NewsFeedProvider({ children }: { children: ReactNode }) {
  const { selectedSlug } = useSelectedCategory()
  const { searchQuery } = useSearch()
  const {
    HERO_SECONDARY_COUNT: heroSecondaryCount,
    LATEST_COUNT: latestCount,
    MOST_READ_COUNT: mostReadCount,
  } = usePortalSettings()

  const infinite = useInfinitePortalNews(
    selectedSlug ? { category: selectedSlug } : {}
  )

  const pages = infinite.data?.pages
  const firstPage = pages?.[0]

  // Achata as páginas numa lista única, deduplicando por id (mesmo que uma
  // página futura devolva um item já visto, não renderizamos cópias). A ordem
  // urgente-primeiro é aplicada por página: as novas entram no fim do feed sem
  // empurrar os cards que o usuário já viu.
  const rawNews = useMemo(() => {
    const seen = new Set<string>()
    const flat: PublicNews[] = []
    for (const page of pages ?? []) {
      for (const item of sortUrgentFirst(page?.data ?? [])) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        flat.push(item)
      }
    }
    return flat
  }, [pages])

  const allNews = useMemo(
    () => filterByQuery(rawNews, searchQuery),
    [rawNews, searchQuery]
  )

  // A composição editorial (hero, secundárias, mais lidas, últimas) é definida
  // pela primeira página; só a grade e o "Viu isso?" avançam com o scroll. Por
  // isso a dependência é o objeto da página 1, não o array `pages` inteiro.
  const stableNews = useMemo(
    () => filterByQuery((firstPage?.data ?? []) as PublicNews[], searchQuery),
    [firstPage, searchQuery]
  )

  // "Mais lidas": o `views` que vem na listagem é o retrato do momento em que
  // ela foi gerada e congela junto com o cache. A contagem atual chega desta
  // query — hidratada do SSR na primeira carga da home, buscada no client
  // quando o pool muda (troca de categoria, por exemplo).
  const candidateIds = useMemo(
    () => stableNews.map((news) => news.id),
    [stableNews]
  )
  const views = useQuery(newsViewsOptions(candidateIds))
  const viewsById = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of views.data ?? []) map.set(item.id, item.views)
    return map
  }, [views.data])

  const sections = useMemo(
    () =>
      selectHomeSections(allNews, stableNews, {
        heroSecondaryCount,
        latestCount,
        mostReadCount,
        // Sem contagem atual para um id, vale o retrato da listagem.
        viewsOf: (news) => viewsById.get(news.id) ?? news.views,
      }),
    [
      allNews,
      stableNews,
      viewsById,
      heroSecondaryCount,
      latestCount,
      mostReadCount,
    ]
  )

  const loadedPages = pages?.length ?? 0

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isError,
    error,
  } = infinite

  const loadNextPage = useCallback(() => fetchNextPage(), [fetchNextPage])

  const value = useMemo<NewsFeedContextValue>(
    () => ({
      allNews,
      sections,
      fetchNextPage: loadNextPage,
      hasNextPage: hasNextPage ?? false,
      isFetchingNextPage,
      isFetching,
      isLoading,
      isError,
      error: (error as Error | null) ?? null,
      loadedPages,
    }),
    [
      allNews,
      sections,
      loadNextPage,
      hasNextPage,
      isFetchingNextPage,
      isFetching,
      isLoading,
      isError,
      error,
      loadedPages,
    ]
  )

  return <NewsFeedContext value={value}>{children}</NewsFeedContext>
}

export function useNewsFeed() {
  const ctx = useContext(NewsFeedContext)
  if (!ctx) throw new Error("useNewsFeed must be used within NewsFeedProvider")
  return ctx
}
