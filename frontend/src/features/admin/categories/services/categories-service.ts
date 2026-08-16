import { api } from "@/services/api"
import type { CategoryPayload, Daum, Root } from "../types/category"

export type GetCategoriesParams = {
  page?: number
  limit?: number
  active?: boolean
}

export async function getCategories(params?: GetCategoriesParams): Promise<Root> {
  const { data } = await api.get<Root>("categories", { params })
  return data
}

export async function createCategory(payload: CategoryPayload): Promise<Daum> {
  const { data } = await api.post<Daum>("categories", payload)
  return data
}

export async function updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<Daum> {
  const { data } = await api.patch<Daum>(`categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`categories/${id}`)
}
