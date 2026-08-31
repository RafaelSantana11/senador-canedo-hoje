export type AuthorPhoto = {
  id: string
  path: string
}

export type Author = {
  id: string
  slug: string
  bio: string | null
  isColumnist: boolean
  userId: number
  name: string
  photo: AuthorPhoto | null
  createdAt: string
  updatedAt: string
}

export type AuthorsResponse = {
  data: Author[]
  hasNextPage: boolean
}

export type GetAuthorsParams = {
  page?: number
  limit?: number
  columnist?: boolean
}

export type UpdateAuthorPayload = {
  name?: string
  bio?: string
  isColumnist?: boolean
  slug?: string
}
