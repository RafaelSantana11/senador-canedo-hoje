import { notFound } from "next/navigation"
import { isAxiosError } from "axios"
import { ArticlePage } from "../components/article-page"
import { getNewsBySlug, getRelatedNews } from "../services/news-service"
import { toArticleView, toRelatedArticleView } from "../utils/mappers"

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

  const relatedResponse = await getRelatedNews(article.category.slug)
  const related = relatedResponse.data
    .filter((item) => item.id !== article.id)
    .slice(0, 3)
    .map(toRelatedArticleView)

  return <ArticlePage article={toArticleView(article)} related={related} />
}
