"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuthors } from "../services/authors-service"
import type { GetAuthorsParams } from "../types/author"

export const AUTHORS_KEY = ["authors"] as const

export function useAuthors(params?: GetAuthorsParams) {
  return useQuery({
    queryKey: [...AUTHORS_KEY, params],
    queryFn: () => getAuthors({ limit: 50, ...params }),
  })
}
