"use client"

import { Fragment } from "react"
import { Clock } from "lucide-react"
import Link from "next/link"
import { FadeInImage } from "@/components/common/fade-in-image"
import { CategoryBadge } from "./category-badge"
import { useNewsFeed } from "../contexts/news-feed-context"
import { formatRelativeTime } from "../utils/format-relative-time"
import { readUrgent, type PublicNews } from "../types/news"
import { assetPath, cn } from "@/lib/utils"
import { AdBanner } from "./ad-banner"
import { InfiniteNewsFooter } from "./infinite-news-footer"
import { BANNER_INTERVAL } from "@/lib/portal-params"

// Escalona a entrada dos cards em passos curtos e previsíveis (0/50/100/150ms),
// sempre com fill-mode para o card não "piscar" durante o atraso. O delay é
// fixo por posição no bloco — cards já montados não reiniciam a animação.
const ENTER_DELAY_MS = [0, 50, 100, 150] as const

function FeaturedCard({
  article,
  index = 0,
}: {
  article: PublicNews
  index?: number
}) {
  const delayMs = ENTER_DELAY_MS[Math.min(index, ENTER_DELAY_MS.length - 1)]

  return (
    <Link
      href={`/noticia/${article.slug}`}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: "both" }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg",
        "motion-safe:animate-in motion-safe:duration-300 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <FadeInImage
          fill
          src={assetPath(article.cover?.path || "/placeholder.svg")}
          alt=""
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
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
          <span>
            {formatRelativeTime(article.publishedAt ?? article.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedBlock({ items }: { items: PublicNews[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((article, index) => (
        <FeaturedCard key={article.id} article={article} index={index} />
      ))}
    </div>
  )
}

export function FeaturedGrid({
  showMiddleBanner = false,
}: {
  showMiddleBanner?: boolean
}) {
  const { sections } = useNewsFeed()
  const { featured } = sections

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
          {showMiddleBanner && i < blocks.length - 1 && (
            <AdBanner size="middle" />
          )}
        </Fragment>
      ))}

      {/* Fim da grade: sentinela do infinite scroll + estados de loading/erro/fim. */}
      <InfiniteNewsFooter />
    </div>
  )
}
