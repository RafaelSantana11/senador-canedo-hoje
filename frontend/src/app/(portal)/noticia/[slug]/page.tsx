import type { Metadata } from "next"
import { isAxiosError } from "axios"
import NewsDetailPage from "@/features/portal/news/pages/news-detail-page"
import { getNewsBySlug } from "@/features/portal/news/services/news-service"
import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import {
  absoluteMediaUrl,
  absoluteSiteUrl,
  defaultOpenGraphImage,
  rssAlternateTypes,
} from "@/lib/seo"
import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"

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
    // `SITE_NAME` configurável alimenta o siteName do OpenGraph e o fallback
    // da descrição. Settings indisponível cai no default de build.
    const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
      () => DEFAULT_PORTAL_SETTINGS
    )
    const url = absoluteSiteUrl(`/noticia/${article.slug}`)
    const description =
      article.summary?.trim() ||
      generateExcerpt(article.body, 160) ||
      `Leia esta notícia no ${siteName}.`
    const image = article.cover?.path
    const tags = article.tags.map((tag) => tag.name)
    return {
      title: article.title,
      description,
      keywords: [...tags, article.category.name],
      authors: [{ name: article.author.name }],
      alternates: {
        canonical: url,
        // O merge raso do metadata substitui o bloco `alternates` do layout —
        // repetir aqui mantém a descoberta do feed nas páginas de notícia.
        types: rssAlternateTypes,
      },
      openGraph: {
        title: article.title,
        description,
        type: "article",
        url,
        siteName,
        locale: "pt_BR",
        publishedTime: article.publishedAt ?? article.createdAt,
        modifiedTime: article.updatedAt,
        authors: [article.author.name],
        section: article.category.name,
        tags,
        // Capa quando existe; senão a imagem padrão do portal.
        images: image
          ? [{ url: absoluteMediaUrl(image), alt: article.title }]
          : [
              {
                ...defaultOpenGraphImage,
                alt: `${siteName} — Notícias em tempo real`,
              },
            ],
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
