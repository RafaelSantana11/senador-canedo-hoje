import { getPublicSettings } from "./settings-service"
import type { PublicSettings } from "../types"

// Opções "puras" dos parâmetros do portal — sem diretiva "use client" para
// servirem ao prefetch do Server Component (root layout) e ao hook no client.
// Compartilhar aqui garante queryKey idêntica nos dois lados.
export const PORTAL_SETTINGS_KEY = ["portal", "settings"] as const

/**
 * O `queryFn` é injetável para o servidor trocar a chamada direta pelo cache de
 * 5 min (`getCachedPublicSettings`), sem mudar a queryKey — mesmo padrão de
 * `categories-options.ts`.
 */
export function portalSettingsOptions(
  queryFn: () => Promise<PublicSettings> = getPublicSettings,
) {
  return {
    queryKey: PORTAL_SETTINGS_KEY,
    queryFn,
    // Acompanha o TTL do cache do servidor: o valor chega hidratado do SSR e
    // não precisa de refetch a cada navegação.
    staleTime: 5 * 60_000,
  }
}
