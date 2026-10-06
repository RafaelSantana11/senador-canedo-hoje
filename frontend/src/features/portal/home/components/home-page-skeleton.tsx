import { Skeleton } from "@/components/ui/skeleton"
import { usePortalSettings } from "@/features/portal/settings/hooks/use-portal-settings"

// O skeleton acompanha as contagens configuradas (settings) para o layout
// reservado bater com o conteúdo real.

function HeroSkeleton({ secondaryCount }: { secondaryCount: number }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3" aria-hidden>
      <Skeleton className="col-span-1 aspect-[16/9] rounded-2xl lg:col-span-2 lg:aspect-auto lg:min-h-[430px]" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: secondaryCount }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-40 flex-1 rounded-2xl lg:h-full lg:min-h-[9rem]"
          />
        ))}
      </div>
    </section>
  )
}

function FeaturedCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
      <Skeleton className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-1 h-5 w-3/4" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-2/3" />
        <div className="mt-auto pt-4">
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

function FeaturedBlockSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <FeaturedCardSkeleton key={i} />
      ))}
    </div>
  )
}

function SidebarSkeleton({
  mostReadCount,
  latestCount,
  sawThisBlockSize,
}: {
  mostReadCount: number
  latestCount: number
  sawThisBlockSize: number
}) {
  return (
    <aside className="flex flex-col gap-8" aria-hidden>
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2 border-b border-border bg-primary px-5 py-3.5">
          <Skeleton className="size-4 rounded-full bg-primary-foreground/20" />
          <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: mostReadCount }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 px-5 py-4">
              <Skeleton className="mt-1 size-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="aspect-square w-full rounded-xl" />

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: latestCount }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: sawThisBlockSize }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function HomePageSkeleton() {
  const {
    BANNER_INTERVAL: bannerInterval,
    HERO_SECONDARY_COUNT: heroSecondaryCount,
    LATEST_COUNT: latestCount,
    MOST_READ_COUNT: mostReadCount,
    SAW_THIS_BLOCK_SIZE: sawThisBlockSize,
  } = usePortalSettings()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8" aria-busy>
      <p role="status" className="sr-only">
        Carregando notícias…
      </p>

      <Skeleton className="mb-8 h-24 w-full rounded-xl sm:h-28" />

      <HeroSkeleton secondaryCount={heroSecondaryCount} />

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-12 lg:col-span-2">
          <div className="flex flex-col gap-6">
            <FeaturedBlockSkeleton count={bannerInterval} />
            <Skeleton className="h-40 w-full rounded-xl sm:h-44" />
            <FeaturedBlockSkeleton count={4} />
          </div>
          <Skeleton className="h-24 w-full rounded-xl sm:h-28" />
        </div>

        <div className="lg:col-span-1">
          <SidebarSkeleton
            mostReadCount={mostReadCount}
            latestCount={latestCount}
            sawThisBlockSize={sawThisBlockSize}
          />
        </div>
      </div>
    </main>
  )
}
