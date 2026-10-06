"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revalidatePortalCache } from "@/services/revalidate-portal"
import { updateSettings } from "../services/settings-service"
import { SETTINGS_KEY } from "./use-settings"
import type { SettingsPatch } from "../types/settings"

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: SettingsPatch) => updateSettings(patch),
    onSuccess: (settings) => {
      // A resposta já é o objeto completo (com os valores normalizados pelo
      // servidor): substitui o cache sem um segundo GET.
      queryClient.setQueryData(SETTINGS_KEY, settings)
      // Parâmetro é global: o portal precisa largar o HTML/valores cacheados.
      revalidatePortalCache(queryClient, ["settings"])
    },
  })
}
