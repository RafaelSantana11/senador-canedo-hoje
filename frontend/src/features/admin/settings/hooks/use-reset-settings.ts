"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { resetSettings } from "../services/settings-service"
import { SETTINGS_KEY } from "./use-settings"

export function useResetSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings)
      revalidatePortalCache(queryClient, ["settings"])
    },
  })
}
