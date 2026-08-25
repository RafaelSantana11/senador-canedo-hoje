import { Skeleton } from "@/components/ui/skeleton"

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="bg-primary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <Skeleton className="h-3 w-48 bg-primary-foreground/20" />
          <div className="hidden items-center gap-4 sm:flex">
            <Skeleton className="h-3 w-10 bg-primary-foreground/20" />
            <Skeleton className="h-3 w-10 bg-primary-foreground/20" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="hidden h-10 max-w-md flex-1 rounded-full md:block" />
        <Skeleton className="size-10 rounded-lg md:hidden" />
      </div>
      <div className="hidden border-t border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16 rounded-full py-3" />
          ))}
        </div>
      </div>
    </header>
  )
}

function HeroSkeleton() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="col-span-1 aspect-[16/10] rounded-2xl lg:col-span-2 lg:aspect-auto lg:h-[28rem]" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 flex-1 rounded-2xl lg:h-full lg:min-h-[9rem]" />
        <Skeleton className="h-40 flex-1 rounded-2xl lg:h-full lg:min-h-[9rem]" />
      </div>
    </section>
  )
}

function FeaturedGridSkeleton() {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2.5">
        <Skeleton className="h-6 w-1.5 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
          >
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
        ))}
      </div>
    </section>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="flex flex-col gap-8">
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2 border-b border-border bg-primary px-5 py-3.5">
          <Skeleton className="size-4 rounded-full bg-primary-foreground/20" />
          <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 px-5 py-4">
              <Skeleton className="mt-1 size-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-full" />
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen">
      <HeaderSkeleton />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-8 h-24 w-full rounded-xl sm:h-28" />

        <div className="mt-0">
          <HeroSkeleton />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-12 lg:col-span-2">
            <FeaturedGridSkeleton />
            <Skeleton className="h-24 w-full rounded-xl sm:h-28" />
          </div>

          <div className="lg:col-span-1">
            <SidebarSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}
