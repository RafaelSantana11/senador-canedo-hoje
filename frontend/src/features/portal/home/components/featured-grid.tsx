"use client"

import { Fragment } from "react"
import { Clock } from "lucide-react"
import Link from "next/link"
import { CategoryBadge } from "./category-badge"
import { usePortalNews, SHOWCASE_PARAMS } from "../hooks/use-news"
import { selectHomeSections } from "../utils/showcase"
import { filterByQuery } from "../utils/filter-by-query"
import { formatRelativeTime } from "../utils/format-relative-time"
import { readUrgent, type PublicNews } from "../types/news"
import { assetPath } from "@/lib/utils"
import { useSelectedCategory } from "../contexts/category-context"
import { useSearch } from "../contexts/search-context"
import { AdBanner } from "./ad-banner"
import { BANNER_INTERVAL } from "@/lib/portal-params"

function FeaturedCard({ article }: { article: PublicNews }) {
  return (
    <Link
      href={`/noticia/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={assetPath(article.cover?.path || "/placeholder.svg")}
          alt=""
          className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
        />
        <CategoryBadge
          category={article.category.name}
          urgent={readUrgent(article.config)}
          className="absolute top-3 left-3 shadow-sm"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-secondary">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.summary}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          <span>{formatRelativeTime(article.publishedAt ?? article.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedBlock({ items }: { items: PublicNews[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((article) => (
        <FeaturedCard key={article.id} article={article} />
      ))}
    </div>
  )
}

export function FeaturedGrid({
  showMiddleBanner = false,
}: {
  showMiddleBanner?: boolean
}) {
  const { selectedSlug } = useSelectedCategory()
  const { searchQuery } = useSearch()
  const { data } = usePortalNews({
    ...SHOWCASE_PARAMS,
    ...(selectedSlug ? { category: selectedSlug } : {}),
  })
  const { featured } = selectHomeSections(
    filterByQuery(data?.data ?? [], searchQuery),
  )

  if (featured.length === 0) return null

  // Divide a lista em blocos e intercala um banner "middle" entre eles.
  const blocks: PublicNews[][] = []
  for (let i = 0; i < featured.length; i += BANNER_INTERVAL) {
    blocks.push(featured.slice(i, i + BANNER_INTERVAL))
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <Fragment key={i}>
          <FeaturedBlock items={block} />
          {showMiddleBanner && i < blocks.length - 1 && <AdBanner size="middle" />}
        </Fragment>
      ))}
    </div>
  )
}
