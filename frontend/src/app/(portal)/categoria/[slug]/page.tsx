import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArchivePage } from "@/features/portal/archive/pages/archive-page"
import { categoryPath } from "@/features/portal/archive/utils/paths"
import {
  getCachedArchiveNews,
  getCachedPublicCategories,
  getCachedPublicSettings,
} from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"
import type { PublicNews } from "@/features/portal/home/types/news"
import {
  absoluteSiteUrl,
  defaultOpenGraphImage,
  rssAlternateTypes,
} from "@/lib/seo"

// Hub de categoria: lista server-rendered com paginação por `?page=`. Como a
// página lê `searchParams`, cada request renderiza de novo — a chamada ao
// backend é amortecida pelo cache de 5 min (`getCachedArchiveNews`). O admin
// regenera via /api/revalidate ao publicar/editar notícia ou categoria.
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

async function findCategory(slug: string) {
  const categories = await getCachedPublicCategories().catch(() => null)
  return categories?.data.find((item) => item.slug === slug) ?? null
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const category = await findCategory(slug)

  if (!category) {
    return {
      title: "Categoria não encontrada",
      robots: { index: false, follow: false },
    }
  }

  const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )
  const page = readPageNumber(query.page)
  const canonical = absoluteSiteUrl(categoryPath(category.slug))
  const url = page > 1 ? `${canonical}?page=${page}` : canonical
  const description =
    category.description?.trim() ||
    `Últimas notícias de ${category.name} em ${siteName}.`

  return {
    title: category.name,
    description,
    alternates: {
      canonical: url,
      types: rssAlternateTypes,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName,
      title: `${category.name} — ${siteName}`,
      description,
      url,
      images: [defaultOpenGraphImage],
    },
  }
}

export default async function CategoryArchivePage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = readPageNumber(query.page)

  const category = await findCategory(slug)
  if (!category) notFound()

  const [settings, categories] = await Promise.all([
    getCachedPublicSettings().catch(() => DEFAULT_PORTAL_SETTINGS),
    getCachedPublicCategories().catch(() => null),
  ])

  let articles: PublicNews[] = []
  let hasNextPage = false
  let loadFailed = false
  try {
    const response = await getCachedArchiveNews(slug, null, page)
    articles = response.data
    hasNextPage = response.hasNextPage
  } catch {
    loadFailed = true
  }

  return (
    <ArchivePage
      eyebrow="Categoria"
      title={category.name}
      description={category.description}
      articles={articles}
      page={page}
      hasNextPage={hasNextPage}
      basePath={categoryPath(category.slug)}
      breadcrumbs={[
        { name: "Início", href: "/" },
        { name: category.name, href: categoryPath(category.slug) },
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
