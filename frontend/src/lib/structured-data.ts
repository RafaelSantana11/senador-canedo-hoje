import { absoluteMediaUrl, absoluteSiteUrl } from "./seo"

const SITE_LANGUAGE = "pt-BR"
const PUBLISHER_LOGO = "/apple-icon.png"

type ArticleForJsonLd = {
  slug: string
  title: string
  cover: { path: string } | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category: { name: string }
  author: { name: string }
  tags: { name: string }[]
}

/**
 * Organization + WebSite, uma vez por página do portal (via `@graph`).
 * `siteName` vem das configurações do portal (`SITE_NAME`) — nunca hardcode
 * o nome aqui, senão o JSON-LD diverge do que o admin configurou.
 */
export function siteJsonLd(siteName: string) {
  const organizationId = absoluteSiteUrl("/#organization")

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        url: absoluteSiteUrl(),
        logo: {
          "@type": "ImageObject",
          url: absoluteSiteUrl(PUBLISHER_LOGO),
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteSiteUrl("/#website"),
        name: siteName,
        url: absoluteSiteUrl(),
        inLanguage: SITE_LANGUAGE,
        publisher: { "@id": organizationId },
      },
    ],
  }
}

export function newsArticleJsonLd(
  article: ArticleForJsonLd,
  description: string,
  siteName: string
) {
  const url = absoluteSiteUrl(`/noticia/${article.slug}`)

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: article.title,
    description,
    ...(article.cover?.path
      ? { image: [absoluteMediaUrl(article.cover.path)] }
      : {}),
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: { "@type": "Person", name: article.author.name },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteSiteUrl(PUBLISHER_LOGO),
      },
    },
    articleSection: article.category.name,
    ...(article.tags.length > 0
      ? { keywords: article.tags.map((tag) => tag.name).join(", ") }
      : {}),
    inLanguage: SITE_LANGUAGE,
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
