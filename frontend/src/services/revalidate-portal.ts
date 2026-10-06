import type { QueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/useAuthStore"
import { assetPath } from "@/lib/utils"

/** Recursos do portal com cache próprio no servidor (`portal-cache.ts`). */
export type PortalResource = "news" | "categories" | "banners" | "settings"

/**
 * Invalida o cache do portal depois de uma mutação no admin.
 *
 * - No browser, derruba as queries do portal (`["portal"]` cobre notícias,
 *   views, categorias, banners e settings).
 * - No servidor, força a regeneração do ISR via Route Handler `/api/revalidate`.
 *   `resources` pede a invalidação das tags daqueles caches (`unstable_cache`);
 *   sem ele, o handler mantém o comportamento original (só as rotas).
 *
 * Fire-and-forget de propósito: uma falha aqui nunca pode quebrar a mutação —
 * o TTL de 5 min regenera o cache de qualquer forma.
 */
export function revalidatePortalCache(
  queryClient?: QueryClient,
  resources?: PortalResource[],
): void {
  queryClient?.invalidateQueries({ queryKey: ["portal"] })

  const { token } = useAuthStore.getState()
  if (typeof window === "undefined" || !token) return

  void fetch(assetPath("/api/revalidate"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(resources ? { "Content-Type": "application/json" } : {}),
    },
    ...(resources ? { body: JSON.stringify({ resources }) } : {}),
  }).catch(() => {})
}
