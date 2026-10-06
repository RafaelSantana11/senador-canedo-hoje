import { Fragment } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { collectionPageJsonLd } from "@/lib/structured-data"
import { absoluteSiteUrl } from "@/lib/seo"
import { assetPath } from "@/lib/utils"
import { categoryPath } from "../utils/paths"
import type { PublicNews } from "@/features/portal/home/types/news"

type Breadcrumb = { name: string; href: string }

export interface ArchivePageProps {
  /** Rótulo pequeno acima do h1 (ex.: "Categoria", "Assunto"). */
  eyebrow: string
  title: string
  description?: string | null
  articles: PublicNews[]
  /** Página atual (1-based). */
  page: number
  hasNextPage: boolean
  /** Caminho do hub sem query, ex.: `/categoria/politica`. */
  basePath: string
  breadcrumbs: Breadcrumb[]
  /** Menu do topo — links reais entre os hubs (crawl + leitor). */
  navCategories?: { name: string; slug: string }[]
  siteName: string
  /** API indisponível: mostra aviso em vez de lista vazia enganosa. */
  loadFailed?: boolean
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ArchiveCard({
  article,
  eager,
}: {
  article: PublicNews
  eager?: boolean
}) {
  const cover = article.cover?.path

  return (
    <Link
      href={`/noticia/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetPath(cover)}
            alt=""
            loading={eager ? "eager" : "lazy"}
            className="size-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
          {article.category.name}
        </span>
        <h2 className="mt-1 font-serif text-lg leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-secondary">
          {article.title}
        </h2>
        {article.summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.summary}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}

export function ArchivePage({
  eyebrow,
  title,
  description,
  articles,
  page,
  hasNextPage,
  basePath,
  breadcrumbs,
  navCategories = [],
  siteName,
  loadFailed,
}: ArchivePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={collectionPageJsonLd({
          name: title,
          description,
          url: absoluteSiteUrl(basePath),
          items: articles.map((article) => ({
            name: article.title,
            url: absoluteSiteUrl(`/noticia/${article.slug}`),
          })),
          breadcrumbs: breadcrumbs.map((item) => ({
            name: item.name,
            url: absoluteSiteUrl(item.href),
          })),
        })}
      />

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {siteName}
          </Link>
          <nav
            aria-label="Categorias"
            className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
            {navCategories.map((category) => (
              <Link
                key={category.slug}
                href={categoryPath(category.slug)}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <nav
          aria-label="Trilha de navegação"
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          {breadcrumbs.map((item, index) => (
            <Fragment key={item.href}>
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              )}
              {index < breadcrumbs.length - 1 ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.name}
                </Link>
              ) : (
                <span className="truncate text-foreground">{item.name}</span>
              )}
            </Fragment>
          ))}
        </nav>

        <p className="mt-6 text-xs font-semibold tracking-wide text-secondary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight font-bold tracking-tight text-balance text-foreground md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {loadFailed ? (
          <p className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar as notícias agora. Tente novamente em
            instantes.
          </p>
        ) : articles.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhuma notícia publicada aqui ainda.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <ArchiveCard
                key={article.id}
                article={article}
                eager={index < 3}
              />
            ))}
          </div>
        )}

        {(page > 1 || hasNextPage) && !loadFailed && (
          <nav
            aria-label="Paginação"
            className="mt-10 flex items-center justify-between border-t border-border pt-6 text-sm font-medium"
          >
            {page > 1 ? (
              <Link
                href={`${basePath}?page=${page - 1}`}
                className="inline-flex items-center gap-1.5 hover:text-secondary"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Anteriores
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">Página {page}</span>
            {hasNextPage ? (
              <Link
                href={`${basePath}?page=${page + 1}`}
                className="inline-flex items-center gap-1.5 hover:text-secondary"
              >
                Próximas
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </div>
  )
}
