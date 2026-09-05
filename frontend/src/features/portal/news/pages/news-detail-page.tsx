import { notFound } from "next/navigation"
import { isAxiosError } from "axios"
import { ArticlePage } from "../components/article-page"
import { getNewsBySlug, getRelatedNews } from "../services/news-service"
import { toArticleView, toRelatedArticleView } from "../utils/mappers"
import type { RelatedArticleView } from "../types/news"

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

  return <ArticlePage article={toArticleView(article)} related={related} />
}
