"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicCategories } from "../services/categories-service"

export const PORTAL_CATEGORIES_KEY = ["portal", "categories"] as const

// Menu do portal: só ativas, ordenadas por nome no servidor. Sem token o
// `?active=` seria ignorado de qualquer forma; explícito cobre quem navega
// logado (o interceptor anexa token).
export function usePortalCategories() {
  return useQuery({
    queryKey: PORTAL_CATEGORIES_KEY,
    queryFn: () => getPublicCategories({ page: 1, limit: 100, active: true }),
  })
}
