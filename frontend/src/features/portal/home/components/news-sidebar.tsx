"use client"

import { Fragment } from "react"
import { Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AdBanner } from "./ad-banner"
import { useNewsFeed } from "../contexts/news-feed-context"
import { formatRelativeTime } from "../utils/format-relative-time"
import { readUrgent, type PublicNews } from "../types/news"
import { cn } from "@/lib/utils"
import { SAW_THIS_BLOCK_SIZE } from "@/lib/portal-params"

const NEW_ITEM_CLASS =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:ease-out motion-safe:fill-mode-both"

export function NewsSidebar() {
  const { sections } = useNewsFeed()
  const { mostRead, latest, sawThis, sawThisStableCount } = sections

  // "Viu isso?": a primeira página define os blocos (divisão equilibrada, até
  // SAW_THIS_BLOCK_SIZE por bloco). Itens de páginas seguintes só preenchem o
  // último bloco ou abrem um novo — nunca reequilibram o que já está na tela.
  const sawThisBlocks: PublicNews[][] = []
  const sawThisBlockStarts: number[] = []
  let sawThisItemCount = 0
  const pushSawThisBlock = (items: PublicNews[]) => {
    sawThisBlockStarts.push(sawThisItemCount)
    sawThisBlocks.push(items)
    sawThisItemCount += items.length
  }

  const stableSawThis = sawThis.slice(0, sawThisStableCount)
  const numBlocks = Math.ceil(stableSawThis.length / SAW_THIS_BLOCK_SIZE)
  if (numBlocks > 0) {
    const base = Math.floor(stableSawThis.length / numBlocks)
    const remainder = stableSawThis.length % numBlocks
    let cursor = 0
    for (let i = 0; i < numBlocks; i++) {
      const size = base + (i < remainder ? 1 : 0)
      pushSawThisBlock(stableSawThis.slice(cursor, cursor + size))
      cursor += size
    }
  }
  for (const article of sawThis.slice(sawThisStableCount)) {
    const lastBlock = sawThisBlocks[sawThisBlocks.length - 1]
    if (!lastBlock || lastBlock.length >= SAW_THIS_BLOCK_SIZE) {
      pushSawThisBlock([article])
    } else {
      lastBlock.push(article)
    }
  }

  if (mostRead.length === 0 && latest.length === 0 && sawThis.length === 0)
    return null

  return (
    <aside className="flex flex-col gap-8" aria-label="Conteúdo complementar">
      {/* Mais lidas */}
      {mostRead.length > 0 && (
        <section
          className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border motion-safe:animate-in motion-safe:duration-500 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
          aria-labelledby="mais-lidas-heading"
        >
          <div className="flex items-center gap-2 border-b border-border bg-primary px-5 py-3.5 text-primary-foreground">
            <TrendingUp className="size-4" />
            <h2
              id="mais-lidas-heading"
              className="font-serif text-lg font-bold"
            >
              Mais lidas
            </h2>
          </div>
          <ol className="divide-y divide-border">
            {mostRead.map((article, i) => (
              <li key={article.id}>
                <Link
                  href={`/noticia/${article.slug}`}
                  className="group flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-muted/60"
                >
                  <span className="font-serif text-2xl leading-none font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
                      {article.category.name}
                    </span>
                    <h3 className="mt-0.5 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-secondary">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <AdBanner size="box" />

      {/* Últimas notícias */}
      {latest.length > 0 && (
        <section
          className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border motion-safe:animate-in motion-safe:duration-500 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
          aria-labelledby="ultimas-heading"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2
              id="ultimas-heading"
              className="flex items-center gap-2 font-serif text-lg font-bold text-primary"
            >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full rounded-full bg-destructive/60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
              </span>
              Últimas notícias
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {latest.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/noticia/${article.slug}`}
                  className="group block px-5 py-4 transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      {formatRelativeTime(
                        article.publishedAt ?? article.createdAt
                      )}
                    </span>
                    {readUrgent(article.config) && (
                      <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                        Urgente
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-secondary">
                    {article.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Viu isso? — blocos de até 5 matérias, banner aside entre eles */}
      {sawThisBlocks.map((block, blockIndex) => (
        <Fragment key={`viu-isso-${blockIndex}`}>
          {blockIndex > 0 && <AdBanner size="box" />}
          <section
            className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border motion-safe:animate-in motion-safe:duration-500 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            aria-labelledby={`viu-isso-heading-${blockIndex}`}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2
                id={`viu-isso-heading-${blockIndex}`}
                className="flex items-center gap-2 font-serif text-lg font-bold text-primary"
              >
                <span className="size-2.5 rounded-full bg-accent" />
                Viu isso?
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {block.map((article, itemIndex) => {
                const isNew =
                  sawThisBlockStarts[blockIndex] + itemIndex >=
                  sawThisStableCount
                return (
                  <li key={article.id} className={cn(isNew && NEW_ITEM_CLASS)}>
                    <Link
                      href={`/noticia/${article.slug}`}
                      className="group block px-5 py-4 transition-colors hover:bg-muted/60"
                    >
                      <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
                        {article.category.name}
                      </span>
                      <h3 className="mt-1 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-secondary">
                        {article.title}
                      </h3>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </Fragment>
      ))}
    </aside>
  )
}
