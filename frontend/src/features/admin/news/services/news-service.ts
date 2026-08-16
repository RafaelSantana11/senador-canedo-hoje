import { api } from "@/services/api"
import type { News, NewsPayload, NewsRoot, NewsStatus } from "../types/news"

export type GetNewsParams = {
  page?: number
  limit?: number
  category?: string
  tag?: string
  status?: NewsStatus
  q?: string
}

export async function getNews(params?: GetNewsParams): Promise<NewsRoot> {
  const { data } = await api.get<NewsRoot>("news", { params })
  return data
}

export async function getNewsBySlug(slug: string): Promise<News> {
  const { data } = await api.get<News>(`news/${slug}`)
  return data
}

export async function createNews(payload: NewsPayload): Promise<News> {
  const { data } = await api.post<News>("news", payload)
  return data
}

export async function updateNews(id: string, payload: Partial<NewsPayload>): Promise<News> {
  const { data } = await api.patch<News>(`news/${id}`, payload)
  return data
}

export async function deleteNews(id: string): Promise<void> {
  await api.delete(`news/${id}`)
}
