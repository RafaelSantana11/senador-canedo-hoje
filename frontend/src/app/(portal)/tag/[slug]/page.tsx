import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArchivePage } from "@/features/portal/archive/pages/archive-page"
import { tagPath } from "@/features/portal/archive/utils/paths"
import {
  getCachedArchiveNews,
  getCachedPublicCategories,
  getCachedPublicSettings,
  getCachedPublicTags,
} from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"
import type { PublicNews } from "@/features/portal/home/types/news"
import {
  absoluteSiteUrl,
  defaultOpenGraphImage,
  rssAlternateTypes,
} from "@/lib/seo"

// Hub de tag (assunto): mesma mecânica do hub de categoria. Tag sem nenhuma
// notícia publicada não vira página — evita conteúdo vazio indexável.
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

function readPageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
}

async function findTag(slug: string) {
  const tags = await getCachedPublicTags().catch(() => null)
  const tag = tags?.data.find((item) => item.slug === slug) ?? null
  if (!tag || (tag.usageCount ?? 0) === 0) return null
  return tag
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const tag = await findTag(slug)

  if (!tag) {
    return {
      title: "Assunto não encontrado",
      robots: { index: false, follow: false },
    }
  }

  const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )
  const page = readPageNumber(query.page)
  const canonical = absoluteSiteUrl(tagPath(tag.slug))
  const url = page > 1 ? `${canonical}?page=${page}` : canonical
  const description =
    tag.description?.trim() ||
    `Notícias marcadas com ${tag.name} em ${siteName}.`

  return {
    title: tag.name,
    description,
    alternates: {
      canonical: url,
      types: rssAlternateTypes,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName,
      title: `${tag.name} — ${siteName}`,
      description,
      url,
      images: [defaultOpenGraphImage],
    },
  }
}

export default async function TagArchivePage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = readPageNumber(query.page)

  const tag = await findTag(slug)
  if (!tag) notFound()

  const [settings, categories] = await Promise.all([
    getCachedPublicSettings().catch(() => DEFAULT_PORTAL_SETTINGS),
    getCachedPublicCategories().catch(() => null),
  ])

  let articles: PublicNews[] = []
  let hasNextPage = false
  let loadFailed = false
  try {
    const response = await getCachedArchiveNews(null, slug, page)
    articles = response.data
    hasNextPage = response.hasNextPage
  } catch {
    loadFailed = true
  }

  return (
    <ArchivePage
      eyebrow="Assunto"
      title={tag.name}
      description={tag.description}
      articles={articles}
      page={page}
      hasNextPage={hasNextPage}
      basePath={tagPath(tag.slug)}
      breadcrumbs={[
        { name: "Início", href: "/" },
        { name: tag.name, href: tagPath(tag.slug) },
      ]}
      navCategories={(categories?.data ?? []).map((item) => ({
        name: item.name,
        slug: item.slug,
      }))}
      siteName={settings.SITE_NAME}
      loadFailed={loadFailed}
    />
  )
}
