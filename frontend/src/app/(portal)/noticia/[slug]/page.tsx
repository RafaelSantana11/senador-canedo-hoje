import type { Metadata } from "next"
import { isAxiosError } from "axios"
import NewsDetailPage from "@/features/portal/news/pages/news-detail-page"
import { getNewsBySlug } from "@/features/portal/news/services/news-service"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import {
  absoluteMediaUrl,
  absoluteSiteUrl,
  defaultOpenGraphImage,
} from "@/lib/seo"

// ISR on-demand: `generateStaticParams` vazio faz cada notícia ser renderizada
// estaticamente na primeira visita (em vez de a cada request) e revalidada a
// cada 5 min. O admin invalida na hora via /api/revalidate ao publicar/editar.
export const revalidate = 300

export function generateStaticParams() {
  return []
}

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
    const tags = article.tags.map((tag) => tag.name)
    return {
      title: article.title,
      description,
      keywords: [...tags, article.category.name],
      authors: [{ name: article.author.name }],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: article.title,
        description,
        type: "article",
        url,
        siteName: "Senador Canedo Hoje",
        locale: "pt_BR",
        publishedTime: article.publishedAt ?? article.createdAt,
        modifiedTime: article.updatedAt,
        authors: [article.author.name],
        section: article.category.name,
        tags,
        // Capa quando existe; senão a imagem padrão do portal.
        images: image
          ? [{ url: absoluteMediaUrl(image), alt: article.title }]
          : [defaultOpenGraphImage],
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
