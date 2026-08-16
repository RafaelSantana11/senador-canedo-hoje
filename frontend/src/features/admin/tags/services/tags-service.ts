import { api } from "@/services/api"
import type { Daum, Root, TagPayload } from "../types/tag"

export type GetTagsParams = {
  page?: number
  limit?: number
  q?: string
}

export async function getTags(params?: GetTagsParams): Promise<Root> {
  const { data } = await api.get<Root>("tags", { params })
  return data
}

export async function createTag(payload: TagPayload): Promise<Daum> {
  const { data } = await api.post<Daum>("tags", payload)
  return data
}

export async function updateTag(id: string, payload: Partial<TagPayload>): Promise<Daum> {
  const { data } = await api.patch<Daum>(`tags/${id}`, payload)
  return data
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`tags/${id}`)
}
