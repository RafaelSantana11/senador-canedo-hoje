"use client"

import { SiteHeader } from "../components/site-header"
import { HeroSection } from "../components/hero-section"
import { FeaturedGrid } from "../components/featured-grid"
import { NewsSidebar } from "../components/news-sidebar"
import { AdBanner } from "../components/ad-banner"
import { HomePageSkeleton } from "../components/home-page-skeleton"
import { usePortalNews } from "../hooks/use-news"
import { usePortalCategories } from "../hooks/use-categories"
import { CategoryProvider } from "../contexts/category-context"

export default function HomePage() {
  const { isLoading: newsLoading, data: newsData } = usePortalNews()
  const { isLoading: categoriesLoading } = usePortalCategories()

  const isLoading = newsLoading || categoriesLoading

  // Banner no meio do conteúdo só aparece com acervo razoavelmente cheio.
  const MIN_NEWS_FOR_MIDDLE_BANNER = 8
  const showMiddleBanner =
    (newsData?.data.length ?? 0) >= MIN_NEWS_FOR_MIDDLE_BANNER

  if (isLoading) {
    return <HomePageSkeleton />
  }

  return (
    <CategoryProvider>
      <div className="min-h-screen">
        <SiteHeader />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <AdBanner size="leaderboard" className="mb-8" />

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
        </main>
      </div>
    </CategoryProvider>
  )
}
