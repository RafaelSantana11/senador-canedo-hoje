import type { Metadata } from "next"
import { isAxiosError } from "axios"
import NewsDetailPage from "@/features/portal/news/pages/news-detail-page"
import { getNewsBySlug } from "@/features/portal/news/services/news-service"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import { absoluteMediaUrl, absoluteSiteUrl } from "@/lib/seo"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const article = await getNewsBySlug(slug)
    const url = absoluteSiteUrl(`/noticia/${article.slug}`)
    const description =
      article.summary?.trim() || generateExcerpt(article.body, 160) ||
      "Leia esta notícia no Senador Canedo Hoje."
    const image = article.cover?.path
    return {
      title: `${article.title} — Senador Canedo Hoje`,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: article.title,
        description,
        type: "article",
        url,
        publishedTime: article.publishedAt ?? article.createdAt,
        authors: [article.author.name],
        images: image ? [{ url: absoluteMediaUrl(image) }] : undefined,
      },
    }
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) throw error

    return {
      title: "Notícia não encontrada",
      description: "A notícia solicitada não foi encontrada.",
      robots: { index: false, follow: false },
    }
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params
  return <NewsDetailPage slug={slug} />
}
