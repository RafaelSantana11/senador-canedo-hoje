import { api } from "@/services/api"
import type {
  GetPublicCategoriesParams,
  PublicCategoryList,
} from "../types/category"

// Rota pública do portal (GET /api/v1/categories). Sem token, só categorias
// ativas voltam (com `newsCount` calculado).
export async function getPublicCategories(
  params?: GetPublicCategoriesParams,
): Promise<PublicCategoryList> {
  const { data } = await api.get<PublicCategoryList>("categories", { params })
  return data
}
