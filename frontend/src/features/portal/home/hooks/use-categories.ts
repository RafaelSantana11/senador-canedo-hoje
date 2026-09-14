"use client"

import { useQuery } from "@tanstack/react-query"
import {
  PORTAL_CATEGORIES_KEY,
  portalCategoriesOptions,
} from "../services/categories-options"

export { PORTAL_CATEGORIES_KEY }

// Menu do portal: busca a lista de categorias ativas (prefetch SSR na home).
export function usePortalCategories() {
  return useQuery(portalCategoriesOptions())
}
