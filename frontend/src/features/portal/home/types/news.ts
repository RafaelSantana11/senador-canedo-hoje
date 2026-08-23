// Visão pública de News (GET /news sem token): só `published` volta e o
// `?status=` é ignorado. Forma conforme §4 de INTEGRACAO-NEWS-CATEGORIES-TAGS.
export type PublicNewsStatus = "draft" | "published" | "archived"

export type PublicNewsPosition =
  | "destaque"
  | "topo"
  | "feed"
  | "lateral"
  | "rodape"
  | "normal"

export type PublicNewsCover = {
  id: string
  path: string
}

export type PublicNewsCategory = {
  id: string
  name: string
  slug: string
}

export type PublicNewsAuthor = {
  id: string
  name: string
}

export type PublicNewsTag = {
  id: string
  name: string
  slug: string
}

export type PublicNews = {
  id: string
  title: string
  slug: string
  summary: string | null
  body: string
  cover: PublicNewsCover | null
  status: PublicNewsStatus
  publishedAt: string | null
  category: PublicNewsCategory
  author: PublicNewsAuthor
  tags: PublicNewsTag[]
  views: number
  config: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export type PublicNewsList = {
  data: PublicNews[]
  hasNextPage: boolean
}

export type GetPublicNewsParams = {
  page?: number
  limit?: number
  category?: string
  tag?: string
  status?: PublicNewsStatus
  q?: string
}

const KNOWN_POSITIONS: PublicNewsPosition[] = [
  "destaque",
  "topo",
  "feed",
  "lateral",
  "rodape",
]

// `config` é jsonb opaco no servidor (§3): chave ausente ou fora do esperado
// vira default, nunca exceção — e a ordem das chaves não é garantida.
export function readPosition(
  config?: Record<string, unknown> | null,
): PublicNewsPosition {
  return KNOWN_POSITIONS.includes(config?.position as PublicNewsPosition)
    ? (config!.position as PublicNewsPosition)
    : "normal"
}

export function readPositionOrder(
  config?: Record<string, unknown> | null,
): number {
  return Number.isFinite(config?.positionOrder)
    ? Number(config!.positionOrder)
    : 0
}

export function readUrgent(config?: Record<string, unknown> | null): boolean {
  return config?.urgent === true
}
