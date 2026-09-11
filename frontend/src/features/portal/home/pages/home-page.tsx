"use client"

import { SiteHeader } from "../components/site-header"
import { HeroSection } from "../components/hero-section"
import { FeaturedGrid } from "../components/featured-grid"
import { NewsSidebar } from "../components/news-sidebar"
import { AdBanner } from "../components/ad-banner"
import { HomePageSkeleton } from "../components/home-page-skeleton"
import { Search, WifiOff, RefreshCw } from "lucide-react"
import { SearchProvider, useSearch } from "../contexts/search-context"
import { CategoryProvider } from "../contexts/category-context"
import { NewsFeedProvider, useNewsFeed } from "../contexts/news-feed-context"
import { MIN_NEWS_FOR_MIDDLE_BANNER } from "@/lib/portal-params"
import { useQueryClient } from "@tanstack/react-query"

function MainSection({ showMiddleBanner }: { showMiddleBanner: boolean }) {
  const { searchQuery, setSearchQuery } = useSearch()
  const { allNews } = useNewsFeed()

  const hasResults = allNews.length > 0 || !searchQuery.trim()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <AdBanner size="leaderboard" className="mb-8" />

      {hasResults ? (
        <>
          <HeroSection />

          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            <div className="flex flex-col gap-12 lg:col-span-2">
              <FeaturedGrid showMiddleBanner={showMiddleBanner} />
              <AdBanner size="leaderboard" />
            </div>

            <div className="lg:col-span-1">
              <NewsSidebar />
            </div>
          </div>
        </>
      ) : (
        <div className="my-12 rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <Search className="mx-auto size-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-serif text-xl font-bold text-foreground">
            Nenhuma notícia encontrada
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Não encontramos resultados para &quot;{searchQuery}&quot;. Tente
            buscar por outros termos.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Limpar busca
          </button>
        </div>
      )}
    </main>
  )
}

function HomePageContent() {
  const queryClient = useQueryClient()
  const { isLoading: newsLoading, allNews, isError: newsError } = useNewsFeed()

  // Categorias e banners não bloqueiam a home: cada um degrada no seu próprio
  // espaço reservado (menu mínimo / moldura "Anuncie aqui"). Só a listagem de
  // notícias justifica o skeleton — e, como a página 1 vem do SSR, o conteúdo
  // real já chega no HTML inicial. Um erro ao buscar páginas seguintes não
  // derruba o que já está na tela: o rodapé da lista mostra o retry.
  const hasError = newsError && allNews.length === 0

  // Banner no meio do conteúdo só aparece com acervo razoavelmente cheio.
  const showMiddleBanner = allNews.length >= MIN_NEWS_FOR_MIDDLE_BANNER

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {newsLoading && !hasError ? (
        <HomePageSkeleton />
      ) : hasError ? (
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="my-12 rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
            <WifiOff className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-serif text-xl font-bold text-foreground">
              Conexão indisponível
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Não foi possível conectar ao servidor. Verifique sua conexão com a
              internet e tente novamente.
            </p>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries()}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </button>
          </div>
        </main>
      ) : (
        <MainSection showMiddleBanner={showMiddleBanner} />
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <SearchProvider>
      <CategoryProvider>
        <NewsFeedProvider>
          <HomePageContent />
        </NewsFeedProvider>
      </CategoryProvider>
    </SearchProvider>
  )
}
