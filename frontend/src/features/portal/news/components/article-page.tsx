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
import { toast } from "sonner"
import { trackShare } from "@/lib/gtag"
import Link from "next/link"
import {
  renderMarkdown,
  splitMarkdownBlocks,
  inContentAdPositions,
} from "@/components/admin/news-editor/markdown-utils"
import { AdBanner } from "@/features/portal/home/components/ad-banner"
import { assetPath } from "@/lib/utils"
import type { RelatedArticleView } from "../types/news"

interface ArticleData {
  title: string
  category: string
  tags?: { id: string; name: string; color?: string | null }[]
  author: string
  image: string
  urgent: boolean
  content: string
  excerpt?: string
  publishedAt?: string
  /** Legenda da foto de capa (fotolegenda). */
  coverCaption?: string
  /** Crédito da foto de capa. */
  coverCredit?: string
}

interface ArticlePageProps {
  article: ArticleData
  related?: RelatedArticleView[]
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

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
    publishedAt,
    coverCaption,
    coverCredit,
  } = article

  const blocks = splitMarkdownBlocks(content)
  const adPositions = inContentAdPositions(blocks.length)

  // -----------------------------------------------------------------
  // Analytics (GA4) da matéria: apenas o evento de compartilhamento.
  // O scroll_depth é rastreado somente na home (HomeScrollTracker).
  // As funções são no-op seguras quando o GA está desativado.
  // -----------------------------------------------------------------

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : ""

  const shareText = encodeURIComponent(`${title} — Senador Canedo Hoje`)
  const shareHref = encodeURIComponent(shareUrl)

  const handleShareClick = () => {
    // share — o usuário clicou em "Compartilhar".
    if (navigator.share) {
      trackShare({ title, category, method: "navigator" })
      void navigator.share({ title, url: shareUrl })
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    trackShare({ title, category, method: "copy" })
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Link copiado!")
      })
    }
  }

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
        <AdBanner size="leaderboard" className="mb-3" />

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
        <div className="mt-3 flex flex-wrap items-center gap-2">
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

        <h1 className="mt-0.5 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
          {title || "Título da matéria"}
        </h1>

        {excerpt && (
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            {excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-y border-border py-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" />
            Por{" "}
            <span className="font-medium text-foreground">
              {author || "Redação"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {publishedAt ? (
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            ) : (
              formatDate(publishedAt)
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {readingTime(content)} min de leitura
          </span>
          <div className="w-full flex items-center gap-1">
            <button
              type="button"
              disabled={preview}
              onClick={() => {
                trackShare({ title, category, method: "whatsapp" })
                window.open(
                  `https://wa.me/?text=${shareText}%20${shareHref}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }}
              aria-label="Compartilhar no WhatsApp"
              className="inline-flex flex-1 text-zinc-950 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs font-medium hover:bg-[#21C063] disabled:opacity-60 hover:text-white"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              disabled={preview}
              onClick={() => {
                trackShare({ title, category, method: "facebook" })
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${shareHref}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }}
              aria-label="Compartilhar no Facebook"
              className="inline-flex flex-1 text-zinc-950 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs font-medium hover:bg-[#0064E0] disabled:opacity-60 hover:text-white"
            >
              <FacebookIcon className="h-3.5 w-3.5" />
              Facebook
            </button>
            <button
              type="button"
              disabled={preview}
              onClick={handleShareClick}
              aria-label="Compartilhar"
              className="inline-flex flex-1 text-zinc-950 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs font-medium hover:bg-zinc-700 disabled:opacity-60 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </button>
          </div>
        </div>

        {/* Cover image */}
        {image && (
          <figure className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(image)}
              alt={coverCaption || title || "Imagem de capa da matéria"}
              className="w-full rounded-lg object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
            {(coverCaption || coverCredit) && (
              <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {coverCaption}
                {coverCaption && coverCredit && " — "}
                {coverCredit && <span>Foto: {coverCredit}</span>}
              </figcaption>
            )}
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
