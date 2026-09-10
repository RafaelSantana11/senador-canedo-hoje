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

/** View model do corpo da página — o que `ArticlePage` renderiza. */
export type ArticleView = {
  title: string
  category: string
  tags: { id: string; name: string; color?: string | null }[]
  author: string
  image: string
  urgent: boolean
  content: string
  excerpt?: string
  publishedAt?: string
}

/** View model dos cards de "Leia também". */
export type RelatedArticleView = {
  id: string
  slug: string
  title: string
  category: string
  image: string
}
