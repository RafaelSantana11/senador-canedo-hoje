import { heroArticle, featuredArticles, latestNews, type Article as SourceArticle } from "@/lib/news-data"

export type PortalArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  author: string
  urgent: boolean
  createdAt: string
}

/** Normalizes a title into a URL-safe slug (lowercase, no accents, dashes). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toPortal(a: SourceArticle, i: number): PortalArticle {
  return {
    id: a.id,
    slug: slugify(a.title),
    title: a.title,
    excerpt: a.excerpt ?? "",
    content: a.content ?? a.excerpt ?? "",
    category: a.category,
    image: a.image,
    author: a.author ?? "Redação",
    urgent: Boolean(a.urgent),
    createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
  }
}

export function getAllArticles(): PortalArticle[] {
  return [heroArticle, ...featuredArticles, ...latestNews].map(toPortal)
}

export function findArticle(slug: string): PortalArticle | undefined {
  return getAllArticles().find((a) => a.slug === slug)
}

export function getRelatedArticles(slug: string, limit = 3): PortalArticle[] {
  const article = findArticle(slug)
  if (!article) return []
  return getAllArticles()
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, limit)
}
