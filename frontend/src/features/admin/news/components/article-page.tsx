"use client"

import { Fragment } from "react"
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Share2,
  User,
} from "lucide-react"
import Link from "next/link"
import {
  renderMarkdown,
  splitMarkdownBlocks,
  inContentAdPositions,
} from "@/components/admin/news-editor/markdown-utils"
import { AdBanner } from "@/features/admin/news/components/ad-banner"
import { assetPath } from "@/lib/utils"
import type { PortalArticle } from "@/lib/articles-store"

interface ArticleData {
  title: string
  category: string
  tags?: { id: string; name: string; color?: string | null }[]
  author: string
  image: string
  urgent: boolean
  content: string
  excerpt?: string
  createdAt?: string
}

interface ArticlePageProps {
  article: ArticleData
  related?: PortalArticle[]
  /** Preview mode renders the same layout without site chrome / real links. */
  preview?: boolean
}

function formatDate(iso?: string): string {
  if (!iso) return "hoje"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "hoje"
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function readingTime(content: string): number {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  return Math.max(1, Math.round(words / 200))
}

const navCategories = ["Política", "Economia", "Esportes"]

export function ArticlePage({
  article,
  related = [],
  preview,
}: ArticlePageProps) {
  const {
    title,
    category,
    tags,
    author,
    image,
    urgent,
    content,
    excerpt,
    createdAt,
  } = article

  const blocks = splitMarkdownBlocks(content)
  const adPositions = inContentAdPositions(blocks.length)

  return (
    <div className={preview ? "bg-background" : "min-h-screen bg-background"}>
      {!preview && (
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Senador<span className="text-primary"> Canedo Hoje</span>
            </Link>
            <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
              <Link href="/" className="hover:text-foreground">
                Início
              </Link>
              {navCategories.map((cat) => (
                <span
                  key={cat}
                  className="cursor-pointer hover:text-foreground"
                >
                  {cat}
                </span>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8 pt-4">
        {/* Top leaderboard ad */}
        <AdBanner size="leaderboard" className="mb-4" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {preview ? (
            <span>Início</span>
          ) : (
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="cursor-pointer hover:text-foreground">
            {category}
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">
            {title || "Título da matéria"}
          </span>
        </nav>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-sm bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            {category}
          </span>
          {tags?.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold border"
              style={{
                backgroundColor: `${t.color || "#6366f1"}15`,
                color: t.color || "inherit",
                borderColor: `${t.color || "#6366f1"}40`,
              }}
            >
              #{t.name}
            </span>
          ))}
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-destructive px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              <AlertCircle className="h-3 w-3" /> Urgente
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
          {title || "Título da matéria"}
        </h1>

        {excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
            {excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" />
            Por{" "}
            <span className="font-medium text-foreground">
              {author || "Redação"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {readingTime(content)} min de leitura
          </span>
          <button
            type="button"
            disabled={preview}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </button>
        </div>

        {/* Cover image */}
        {image && (
          <figure className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(image)}
              alt=""
              className="w-full rounded-lg object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
          </figure>
        )}

        {/* Body */}
        <div className="mt-8 text-base leading-relaxed text-foreground md:text-lg">
          {blocks.length === 0 && (
            <p className="text-muted-foreground">
              O conteúdo da matéria aparecerá aqui.
            </p>
          )}
          {blocks.map((block, i) => (
            <Fragment key={`block-${i}`}>
              <div
                dangerouslySetInnerHTML={{ __html: renderMarkdown(block) }}
              />
              {adPositions.includes(i) && (
                <AdBanner size="leaderboard" className="my-4" />
              )}
            </Fragment>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section
            className="mt-14 border-t border-border pt-8"
            aria-labelledby="relacionadas-heading"
          >
            <h2
              id="relacionadas-heading"
              className="text-xl font-bold text-foreground"
            >
              Leia também
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {related.map((item) => {
                const card = (
                  <>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={assetPath(item.image)}
                          alt=""
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display =
                              "none"
                          }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <span className="text-xs font-semibold tracking-wide uppercase text-secondary">
                        {item.category}
                      </span>
                      <h3 className="text-sm leading-snug font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                  </>
                )
                return preview ? (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                  >
                    {card}
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href={`/noticia/${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-ring/50"
                  >
                    {card}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
