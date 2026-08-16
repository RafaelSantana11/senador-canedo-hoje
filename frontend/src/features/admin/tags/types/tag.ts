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
  usageCount: number
  createdAt: string
}

export type TagPayload = {
  name: string
  slug?: string
  description?: string | null
  color?: string | null
}
