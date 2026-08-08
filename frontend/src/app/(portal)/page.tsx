import { SiteHeader } from "@/features/admin/news/components/site-header"
import { HeroSection } from "@/features/admin/news/components/hero-section"
import { FeaturedGrid } from "@/features/admin/news/components/featured-grid"
import { NewsSidebar } from "@/features/admin/news/components/news-sidebar"
// import { VideosSection } from "@/features/admin/news/components/videos-section"
import { AdBanner } from "@/features/admin/news/components/ad-banner"

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
          </div>

          <div className="lg:col-span-1">
            <NewsSidebar />
          </div>
        </div>

        {/* <div className="mt-12">
          <VideosSection />
        </div> */}
      </main>
    </div>
  )
}
