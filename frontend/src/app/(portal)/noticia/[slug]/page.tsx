import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArticlePage } from "@/features/admin/news/components/article-page"
import { findArticle, getRelatedArticles } from "@/lib/articles-store"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = findArticle(slug)
  if (!article) {
    return {
      title: "Notícia não encontrada",
      robots: { index: false },
    }
  }
  return {
    title: `${article.title} — Senador Canedo Hoje`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: [{ url: article.image }],
    },
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = findArticle(slug)
  if (!article) notFound()

  const related = getRelatedArticles(slug, 3)

  return <ArticlePage article={article} related={related} />
}
