// Visão pública de Categories (GET /categories sem token): só `active: true`
// volta e o `?active=` é ignorado. `newsCount` vem calculado na listagem.
export type PublicCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  active: boolean
  newsCount?: number
  createdAt: string
}

export type PublicCategoryList = {
  data: PublicCategory[]
  hasNextPage: boolean
}

export type GetPublicCategoriesParams = {
  page?: number
  limit?: number
  active?: boolean
}
