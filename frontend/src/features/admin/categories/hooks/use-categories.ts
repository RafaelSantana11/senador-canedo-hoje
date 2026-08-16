"use client"

import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../services/categories-service"

export const CATEGORIES_KEY = ["categories"] as const

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => getCategories({ limit: 100 }),
  })
}
