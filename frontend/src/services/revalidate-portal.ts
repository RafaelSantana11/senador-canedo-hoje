import type { QueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/useAuthStore"
import { assetPath } from "@/lib/utils"

/**
 * Invalida o cache do portal depois de uma mutação no admin.
 *
 * - No browser, derruba as queries do portal (`["portal"]` cobre notícias e
 *   categorias; banners já são cobertos por `["banners"]`).
 * - No servidor, força a regeneração do ISR via Route Handler `/api/revalidate`.
 *
 * Fire-and-forget de propósito: uma falha aqui nunca pode quebrar a mutação —
 * o TTL de 5 min regenera o cache de qualquer forma.
 */
export function revalidatePortalCache(queryClient?: QueryClient): void {
  queryClient?.invalidateQueries({ queryKey: ["portal"] })

  const { token } = useAuthStore.getState()
  if (typeof window === "undefined" || !token) return

  void fetch(assetPath("/api/revalidate"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {})
}
