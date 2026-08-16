export type NewsStatus = "draft" | "published" | "archived"

export type NewsPosition = "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"

export type NewsConfig = {
  position?: NewsPosition
  positionOrder?: number
  urgent?: boolean
}

export type NewsCover = {
  id: string
  path: string
}

export type NewsCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  active: boolean
  createdAt: string
}

export type NewsAuthor = {
  id: string
  slug: string
  bio: string | null
  isColumnist: boolean
  userId: number | string
  name: string
  photo: NewsCover | null
  createdAt: string
  updatedAt: string
}

export type NewsTag = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  createdAt: string
}

export type News = {
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

export type NewsRoot = {
  data: News[]
  hasNextPage: boolean
}

export type NewsPayload = {
  title: string
  slug?: string
  summary?: string | null
  body: string
  cover?: { id: string } | null
  status?: NewsStatus
  category: { id: string }
  tags?: { id: string }[]
  config?: Record<string, unknown>
}

export type NewsRowStatus = "Publicado" | "Rascunho" | "Arquivada"

export type NewsRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  author: string
  status: NewsRowStatus
  urgent: boolean
  createdAt: string
  position: NewsPosition
  config: Record<string, unknown> | null
}

export const KNOWN_POSITIONS: NewsPosition[] = [
  "destaque",
  "topo",
  "feed",
  "lateral",
  "rodape",
  "normal",
]

export function readPosition(config?: Record<string, unknown> | null): NewsPosition {
  return KNOWN_POSITIONS.includes(config?.position as NewsPosition)
    ? (config!.position as NewsPosition)
    : "normal"
}

export function readPositionOrder(config?: Record<string, unknown> | null): number {
  return Number.isFinite(config?.positionOrder)
    ? Number(config!.positionOrder)
    : 0
}

export function readUrgent(config?: Record<string, unknown> | null): boolean {
  return config?.urgent === true
}

export function newsToRow(n: News): NewsRow {
  return {
    id: n.id,
    slug: n.slug,
    title: n.title,
    excerpt: n.summary ?? "",
    content: n.body,
    category: n.category.name,
    image: n.cover?.path ?? "",
    author: n.author.name,
    status: n.status === "published" ? "Publicado" : n.status === "archived" ? "Arquivada" : "Rascunho",
    urgent: readUrgent(n.config),
    createdAt: n.createdAt,
    position: readPosition(n.config),
    config: n.config,
  }
}

export function buildNewsConfig(
  base: Record<string, unknown> | null | undefined,
  position: NewsPosition,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(base ?? {}) }
  next.position = position
  if (position === "feed" || position === "lateral") {
    next.positionOrder =
      typeof (base as NewsConfig | null)?.positionOrder === "number"
        ? (base as NewsConfig)!.positionOrder!
        : 0
  } else {
    delete next.positionOrder
  }
  if (position === "normal") {
    delete next.position
  }
  return next
}
