"use client"

import { useQuery } from "@tanstack/react-query"
import { getTags } from "../services/tags-service"

export const TAGS_KEY = ["tags"] as const

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => getTags({ limit: 100 }),
  })
}
