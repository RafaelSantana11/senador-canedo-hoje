import type { NewsDetail, ArticleView, RelatedArticleView } from "../types/news"

// `config` é jsonb opaco no servidor: chave ausente ou fora do esperado vira
// default, nunca exceção.
export function readUrgent(config?: Record<string, unknown> | null): boolean {
  return config?.urgent === true
}

/** Mapeia a notícia da API para o que a página renderiza. */
export function toArticleView(news: NewsDetail): ArticleView {
  return {
    title: news.title,
    category: news.category.name,
    tags: news.tags.map(({ id, name, color }) => ({ id, name, color })),
    author: news.author?.name ?? "Redação",
    image: news.cover?.path ?? "",
    urgent: readUrgent(news.config),
    content: news.body,
    excerpt: news.summary ?? "",
    publishedAt: news.publishedAt ?? news.createdAt,
  }
}

/** Mapeia uma notícia da listagem para um card de "Leia também". */
export function toRelatedArticleView(news: NewsDetail): RelatedArticleView {
  return {
    id: news.id,
    slug: news.slug,
    title: news.title,
    category: news.category.name,
    image: news.cover?.path ?? "",
  }
}
