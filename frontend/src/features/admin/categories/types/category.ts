export interface Root {
  data: Daum[]
  hasNextPage: boolean
}

export interface Daum {
  id: string
  name: string
  slug: string
  description: string
  color: string
  active: boolean
  newsCount: number
  createdAt: string
}

export type CategoryPayload = {
  name: string
  slug?: string
  description?: string | null
  color?: string | null
  active?: boolean
}
