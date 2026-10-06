import type { PublicSettings } from "@/features/portal/settings/types"
import {
  SITE_CITY,
  SITE_COUNTRY,
  SITE_REGION,
  SITE_SOCIAL_LINKS,
} from "./portal-params"
import { absoluteMediaUrl, absoluteSiteUrl } from "./seo"

const SITE_LANGUAGE = "pt-BR"

/** Fallback do logo quando o portal não configurou um (`LOGO` nas settings). */
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

/** Logo real do portal (settings) com fallback para o asset do build. */
function organizationLogoUrl(settings: PublicSettings) {
  return settings.LOGO?.path
    ? absoluteMediaUrl(settings.LOGO.path)
    : absoluteSiteUrl(PUBLISHER_LOGO)
}

/** WhatsApp/e-mail do rodapé viram `ContactPoint` — os mesmos canais
 *  exibidos ao leitor, agora legíveis como entidade por buscadores e IAs. */
function organizationContactPoints(settings: PublicSettings) {
  const points: Record<string, unknown>[] = []

  const whatsappDigits = settings.WHATSAPP_NUMBER.replace(/\D/g, "")
  if (whatsappDigits) {
    points.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+${whatsappDigits}`,
      url: `https://wa.me/${whatsappDigits}`,
    })
  }

  if (settings.CONTACT_EMAIL) {
    points.push({
      "@type": "ContactPoint",
      contactType: "editorial",
      email: settings.CONTACT_EMAIL,
    })
  }

  return points
}

/**
 * Organization + WebSite, uma vez por página do portal (via `@graph`).
 *
 * `NewsMediaOrganization` é o subtipo de `Organization` que descreve veículos
 * jornalísticos; nome/logo vêm das settings para nunca divergirem da marca
 * exibida no header/footer.
 */
export function siteJsonLd(settings: PublicSettings) {
  const organizationId = absoluteSiteUrl("/#organization")
  const contactPoints = organizationContactPoints(settings)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": organizationId,
        name: settings.SITE_NAME,
        url: absoluteSiteUrl(),
        logo: {
          "@type": "ImageObject",
          url: organizationLogoUrl(settings),
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_CITY,
          addressRegion: SITE_REGION,
          addressCountry: SITE_COUNTRY,
        },
        areaServed: { "@type": "City", name: SITE_CITY },
        ...(SITE_SOCIAL_LINKS.length > 0 ? { sameAs: SITE_SOCIAL_LINKS } : {}),
        ...(contactPoints.length > 0 ? { contactPoint: contactPoints } : {}),
      },
      {
        "@type": "WebSite",
        "@id": absoluteSiteUrl("/#website"),
        name: settings.SITE_NAME,
        url: absoluteSiteUrl(),
        inLanguage: SITE_LANGUAGE,
        publisher: { "@id": organizationId },
      },
    ],
  }
}

export function newsArticleJsonLd(
  article: ArticleForJsonLd,
  description: string
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
    isAccessibleForFree: true,
    author: { "@type": "Person", name: article.author.name },
    // Referência à entidade publicada no `@graph` do layout do portal — evita
    // um segundo publisher com nome/logo que poderiam divergir dos settings.
    publisher: { "@id": absoluteSiteUrl("/#organization") },
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

/**
 * Hubs de categoria/tag: `CollectionPage` + `ItemList` + breadcrumb num único
 * `@graph`. A lista é o que motores generativos leem para entender o recorte
 * tópico do hub — os itens apontam para as notícias na mesma ordem da página.
 */
export function collectionPageJsonLd({
  name,
  url,
  items,
  breadcrumbs,
  description,
}: {
  name: string
  url: string
  items: { name: string; url: string }[]
  breadcrumbs: { name: string; url: string }[]
  description?: string | null
}) {
  const listId = `${url}#itemlist`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name,
        ...(description ? { description } : {}),
        inLanguage: SITE_LANGUAGE,
        mainEntity: { "@id": listId },
        isPartOf: { "@id": absoluteSiteUrl("/#website") },
      },
      {
        "@type": "ItemList",
        "@id": listId,
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  }
}
