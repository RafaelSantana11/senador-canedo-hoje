import { SiteHeader } from "@/components/news/site-header"
import { HeroSection } from "@/components/news/hero-section"
import { FeaturedGrid } from "@/components/news/featured-grid"
import { NewsSidebar } from "@/components/news/news-sidebar"
import { ColumnistsSection } from "@/components/news/columnists-section"
import { VideosSection } from "@/components/news/videos-section"
import { AdBanner } from "@/components/news/ad-banner"
import { SiteFooter } from "@/components/news/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdBanner size="leaderboard" className="mb-8" />

        <HeroSection />

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-12 lg:col-span-2">
            <FeaturedGrid />
            <AdBanner size="leaderboard" />
            <ColumnistsSection />
          </div>

          <div className="lg:col-span-1">
            <NewsSidebar />
          </div>
        </div>

        <div className="mt-12">
          <VideosSection />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
