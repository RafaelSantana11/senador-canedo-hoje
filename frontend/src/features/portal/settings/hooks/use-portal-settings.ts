"use client"

import { useQuery } from "@tanstack/react-query"
import { portalSettingsOptions } from "../services/settings-options"
import { DEFAULT_PORTAL_SETTINGS } from "../types"

/**
 * Parâmetros do portal em runtime.
 *
 * O root layout hidrata esta query via SSR (com cache de 5 min no servidor),
 * então o primeiro render do client já traz os valores reais — sem flash de
 * nome/logo padrão. Até a resposta chegar, ou se ela falhar, valem os defaults
 * de build.
 */
export function usePortalSettings() {
  const { data } = useQuery(portalSettingsOptions())
  return data ?? DEFAULT_PORTAL_SETTINGS
}
