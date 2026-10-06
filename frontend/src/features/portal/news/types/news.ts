// Contrato do detalhe público (GET /news/:slug) e da listagem usada para as
// relacionadas (GET /news?category=slug). Espelha o domínio `News` do backend —
// mantido independente dos tipos da home de propósito: cada módulo dona da
// sua visão do contrato.
export type NewsStatus = "draft" | "published" | "archived"

export type NewsCover = {
  id: string
  path: string
}

export type NewsCategory = {
  id: string
  name: string
  slug: string
}

export type NewsAuthor = {
  id: string
  name: string
}

export type NewsTag = {
  id: string
  name: string
  slug: string
  color?: string | null
}

export type NewsDetail = {
  id: string
  title: string
  slug: string
  summary: string | null
  body: string
  cover: NewsCover | null
  status: NewsStatus
  publishedAt: string | null
  category: NewsCategory
  author: NewsAuthor
  tags: NewsTag[]
  views: number
  config: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type NewsListResponse = {
  data: NewsDetail[]
  hasNextPage: boolean
}

/** Contagem de leituras devolvida por `GET /news/views` e `POST /news/:id/views`. */
export type NewsViewCount = {
  id: string
  views: number
}

/** View model do corpo da página — o que `ArticlePage` renderiza. */
export type ArticleView = {
  /** Necessário para registrar a visita (`POST /news/:id/views`). */
  id: string
  title: string
  category: string
  /** Slug da categoria — link para o hub `/categoria/[slug]`. */
  categorySlug?: string
  tags: { id: string; name: string; slug?: string; color?: string | null }[]
  author: string
  image: string
  urgent: boolean
  content: string
  excerpt?: string
  publishedAt?: string
  coverCaption?: string
  coverCredit?: string
}

/** View model dos cards de "Leia também". */
export type RelatedArticleView = {
  id: string
  slug: string
  title: string
  category: string
  image: string
}
