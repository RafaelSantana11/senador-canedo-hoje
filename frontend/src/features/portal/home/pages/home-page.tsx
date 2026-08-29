"use client"

import { SiteHeader } from "../components/site-header"
import { HeroSection } from "../components/hero-section"
import { FeaturedGrid } from "../components/featured-grid"
import { NewsSidebar } from "../components/news-sidebar"
import { AdBanner } from "../components/ad-banner"
import { HomePageSkeleton } from "../components/home-page-skeleton"
import { usePortalNews } from "../hooks/use-news"
import { usePortalCategories } from "../hooks/use-categories"
import { useServeBanners } from "../hooks/use-serve-banners"
import { Search } from "lucide-react"
import { SearchProvider, useSearch } from "../contexts/search-context"
import { filterByQuery } from "../utils/filter-by-query"
import { CategoryProvider, useSelectedCategory } from "../contexts/category-context"
import { PublicNews } from "../types/news"
import { MIN_NEWS_FOR_MIDDLE_BANNER } from "@/lib/portal-params"

function MainSection({ showMiddleBanner, allNews }: { showMiddleBanner: boolean; allNews: PublicNews[] }) {
  const { searchQuery, setSearchQuery } = useSearch()
  const { selectedSlug } = useSelectedCategory()

  const filteredNews = filterByQuery(
    selectedSlug ? allNews.filter((item) => item.category?.slug === selectedSlug) : allNews,
    searchQuery
  )

  const hasResults = filteredNews.length > 0 || !searchQuery.trim()

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
            Não encontramos resultados para &quot;{searchQuery}&quot;. Tente buscar por outros termos.
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

export default function HomePage() {
  const { isLoading: newsLoading, data: newsData } = usePortalNews()
  const { isLoading: categoriesLoading } = usePortalCategories()
  const { isLoading: bannersLoading } = useServeBanners()

  const isLoading = newsLoading || categoriesLoading || bannersLoading
  const allNews = newsData?.data ?? []

  // Banner no meio do conteúdo só aparece com acervo razoavelmente cheio.
  const showMiddleBanner = allNews.length >= MIN_NEWS_FOR_MIDDLE_BANNER

  if (isLoading) {
    return <HomePageSkeleton />
  }

  return (
    <SearchProvider>
      <CategoryProvider>
        <div className="min-h-screen">
          <SiteHeader />
          <MainSection showMiddleBanner={showMiddleBanner} allNews={allNews} />
        </div>
      </CategoryProvider>
    </SearchProvider>
  )
}
