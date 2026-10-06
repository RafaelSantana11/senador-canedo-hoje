// Visão pública de Tag (GET /tags sem token): a rota é anônima e devolve
// `usageCount` calculado — é o que decide se um hub de tag tem conteúdo.
export type PublicTag = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  usageCount?: number
  createdAt: string
}

export type PublicTagList = {
  data: PublicTag[]
  hasNextPage: boolean
}
