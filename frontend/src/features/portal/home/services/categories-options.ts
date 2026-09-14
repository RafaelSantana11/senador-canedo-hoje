import { getPublicCategories } from "./categories-service"
import type { PublicCategoryList } from "../types/category"

// Opções "puras" do menu de categorias — sem diretiva "use client" para
// servirem ao prefetch do Server Component (home) e ao hook no client.
// Compartilhar aqui garante queryKey idêntica nos dois lados, então o
// HydrationBoundary hidrata sem refetch no mount.
export const PORTAL_CATEGORIES_KEY = ["portal", "categories"] as const

// Só ativas, ordenadas por nome no servidor. A rota é anônima (`publicApi` não
// anexa token), então o `?active=` explícito só documenta a intenção — o
// backend já filtra sem sessão.
//
// O `queryFn` é injetável para o servidor trocar a chamada direta pelo cache de
// 5 min (`getCachedPublicCategories`), sem mudar a queryKey.
export function portalCategoriesOptions(
  queryFn: () => Promise<PublicCategoryList> = () =>
    getPublicCategories({ page: 1, limit: 100, active: true }),
) {
  return {
    queryKey: PORTAL_CATEGORIES_KEY,
    queryFn,
  }
}
