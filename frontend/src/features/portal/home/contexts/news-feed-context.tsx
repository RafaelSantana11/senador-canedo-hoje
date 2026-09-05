"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useInfinitePortalNews } from "../hooks/use-infinite-news"
import { selectHomeSections, type HomeSections } from "../utils/showcase"
import { filterByQuery } from "../utils/filter-by-query"
import type { PublicNews } from "../types/news"
import { useSelectedCategory } from "./category-context"
import { useSearch } from "./search-context"

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

  const infinite = useInfinitePortalNews(
    selectedSlug ? { category: selectedSlug } : {},
  )

  // Achata as páginas numa lista única, deduplicando por id (mesmo que uma
  // página futura devolva um item já visto, não renderizamos cópias).
  const rawNews = useMemo(() => {
    const seen = new Set<string>()
    const flat: PublicNews[] = []
    for (const page of infinite.data?.pages ?? []) {
      for (const item of page?.data ?? []) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        flat.push(item)
      }
    }
    return flat
  }, [infinite.data])

  const allNews = useMemo(
    () => filterByQuery(rawNews, searchQuery),
    [rawNews, searchQuery],
  )

  const stableNews = useMemo(
    () =>
      filterByQuery(
        (infinite.data?.pages[0]?.data ?? []) as PublicNews[],
        searchQuery,
      ),
    [infinite.data, searchQuery],
  )

  const sections = useMemo(
    () => selectHomeSections(allNews, stableNews),
    [allNews, stableNews],
  )

  const loadedPages = infinite.data?.pages.length ?? 0

  const value: NewsFeedContextValue = {
    allNews,
    sections,
    fetchNextPage: () => infinite.fetchNextPage(),
    hasNextPage: infinite.hasNextPage ?? false,
    isFetchingNextPage: infinite.isFetchingNextPage,
    isFetching: infinite.isFetching,
    isLoading: infinite.isLoading,
    isError: infinite.isError,
    error: (infinite.error as Error | null) ?? null,
    loadedPages,
  }

  return <NewsFeedContext value={value}>{children}</NewsFeedContext>
}

export function useNewsFeed() {
  const ctx = useContext(NewsFeedContext)
  if (!ctx) throw new Error("useNewsFeed must be used within NewsFeedProvider")
  return ctx
}
