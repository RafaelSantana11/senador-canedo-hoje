"use client"

import { useQuery } from "@tanstack/react-query"
import { getSettings } from "../services/settings-service"

export const SETTINGS_KEY = ["settings"] as const

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: getSettings,
    staleTime: 60_000,
  })
}
