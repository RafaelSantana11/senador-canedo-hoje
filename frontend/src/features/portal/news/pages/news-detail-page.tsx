import { notFound } from "next/navigation"
import { isAxiosError } from "axios"
import { ArticlePage } from "../components/article-page"
import { getNewsBySlug, getRelatedNews } from "../services/news-service"
import { toArticleView, toRelatedArticleView } from "../utils/mappers"
import type { RelatedArticleView } from "../types/news"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteSiteUrl } from "@/lib/seo"
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/structured-data"

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

  let related: RelatedArticleView[] = []
  try {
    const relatedResponse = await getRelatedNews(article.category.slug)
    related = relatedResponse.data
      .filter((item) => item.id !== article.id)
      .slice(0, 3)
      .map(toRelatedArticleView)
  } catch {
    // Recommendations are optional; they must not make the article unavailable.
    related = []
  }

  const url = absoluteSiteUrl(`/noticia/${article.slug}`)
  const description =
    article.summary?.trim() ||
    generateExcerpt(article.body, 160) ||
    "Leia esta notícia no Senador Canedo Hoje."

  return (
    <>
      <JsonLd data={newsArticleJsonLd(article, description)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: absoluteSiteUrl() },
          { name: article.title, url },
        ])}
      />
      <ArticlePage article={toArticleView(article)} related={related} />
    </>
  )
}
