"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicCategories } from "../services/categories-service"

export const PORTAL_CATEGORIES_KEY = ["portal", "categories"] as const

// Menu do portal: só ativas, ordenadas por nome no servidor. A rota é anônima
// (`publicApi` não anexa token), então o `?active=` explícito só documenta a
// intenção — o backend já filtra sem sessão.
export function usePortalCategories() {
  return useQuery({
    queryKey: PORTAL_CATEGORIES_KEY,
    queryFn: () => getPublicCategories({ page: 1, limit: 100, active: true }),
  })
}
