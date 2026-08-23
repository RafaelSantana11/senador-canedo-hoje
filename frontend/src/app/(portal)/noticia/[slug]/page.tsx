import type { Metadata } from "next"
import NewsDetailPage from "@/features/portal/news/pages/news-detail-page"
import { getNewsBySlug } from "@/features/portal/news/services/news-service"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const article = await getNewsBySlug(slug)
    const image = article.cover?.path ?? ""
    return {
      title: `${article.title} — Senador Canedo Hoje`,
      description: article.summary ?? undefined,
      openGraph: {
        title: article.title,
        description: article.summary ?? undefined,
        type: "article",
        images: image ? [{ url: image }] : undefined,
      },
    }
  } catch {
    return {
      title: "Notícia não encontrada",
      robots: { index: false },
    }
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params
  return <NewsDetailPage slug={slug} />
}
