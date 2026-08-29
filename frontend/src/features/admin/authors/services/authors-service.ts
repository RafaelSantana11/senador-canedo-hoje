import { api } from "@/services/api"
import type { Author, AuthorsResponse, GetAuthorsParams, UpdateAuthorPayload } from "../types/author"

export async function getAuthors(params?: GetAuthorsParams): Promise<AuthorsResponse> {
  const { data } = await api.get<AuthorsResponse>("authors", { params })
  return data
}

export async function getAuthorBySlug(slug: string): Promise<Author> {
  const { data } = await api.get<Author>(`authors/${slug}`)
  return data
}

export async function updateAuthor(id: string, payload: UpdateAuthorPayload): Promise<Author> {
  const { data } = await api.patch<Author>(`authors/${id}`, payload)
  return data
}
