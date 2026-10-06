import { notFound } from "next/navigation"
import { isAxiosError } from "axios"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  noop,
} from "@tanstack/react-query"
import { ArticlePage } from "../components/article-page"
import { getNewsBySlug, getRelatedNews } from "../services/news-service"
import { toArticleView, toRelatedArticleView } from "../utils/mappers"
import type { RelatedArticleView } from "../types/news"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteSiteUrl } from "@/lib/seo"
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/structured-data"
import { serveBannersOptions } from "@/features/portal/home/services/banners-options"
import { categoryPath } from "@/features/portal/archive/utils/paths"
import {
  getCachedPublicCategories,
  getCachedPublicSettings,
  getCachedServeBanners,
} from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"

interface NewsDetailPageProps {
  slug: string
}

export default async function NewsDetailPage({ slug }: NewsDetailPageProps) {
  let article
  try {
    article = await getNewsBySlug(slug)
  } catch (err) {
    // Slug inexistente ou não publicada: 404 de verdade, com a tela do segmento.
    if (isAxiosError(err) && err.response?.status === 404) notFound()
    throw err
  }

  // Parâmetros do portal: quantas relacionadas exibir (`RELATED_NEWS_COUNT`) e
  // o nome do site (`SITE_NAME`), usado na descrição padrão — a identidade do
  // JSON-LD vem pelo `@id` da Organization publicada no layout do portal. As
  // categorias viram o menu do topo (links para os hubs). Pede uma relacionada
  // a mais porque a própria notícia pode voltar na listagem da categoria.
  // Settings indisponível cai no default — recomendação e identidade são
  // opcionais para a matéria abrir.
  const [
    { RELATED_NEWS_COUNT: relatedNewsCount, SITE_NAME: siteName },
    categories,
  ] = await Promise.all([
    getCachedPublicSettings().catch(() => DEFAULT_PORTAL_SETTINGS),
    getCachedPublicCategories().catch(() => null),
  ])

  let related: RelatedArticleView[] = []
  try {
    const relatedResponse = await getRelatedNews(
      article.category.slug,
      relatedNewsCount + 1
    )
    related = relatedResponse.data
      .filter((item) => item.id !== article.id)
      .slice(0, relatedNewsCount)
      .map(toRelatedArticleView)
  } catch {
    // Recommendations are optional; they must not make the article unavailable.
    related = []
  }

  const url = absoluteSiteUrl(`/noticia/${article.slug}`)
  const description =
    article.summary?.trim() ||
    generateExcerpt(article.body, 160) ||
    `Leia esta notícia no ${siteName}.`

  // Banners vêm do mesmo cache de 5 min da home (`getCachedServeBanners`) e são
  // hidratados aqui para o AdBanner não chamar `banners/serve` no browser.
  const queryClient = new QueryClient()
  await queryClient
    .prefetchQuery(serveBannersOptions(undefined, getCachedServeBanners))
    .catch(noop)

  return (
    <>
      <JsonLd data={newsArticleJsonLd(article, description)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: absoluteSiteUrl() },
          {
            name: article.category.name,
            url: absoluteSiteUrl(categoryPath(article.category.slug)),
          },
          { name: article.title, url },
        ])}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ArticlePage
          article={toArticleView(article)}
          related={related}
          navCategories={(categories?.data ?? []).map((item) => ({
            name: item.name,
            slug: item.slug,
          }))}
        />
      </HydrationBoundary>
    </>
  )
}
