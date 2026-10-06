import type { QueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/useAuthStore"
import { assetPath } from "@/lib/utils"

/** Recursos do portal com cache próprio no servidor (`portal-cache.ts`). */
export type PortalResource =
  "news" | "categories" | "banners" | "settings" | "tags"

/**
 * Invalida o cache do portal depois de uma mutação no admin.
 *
 * - No browser, derruba as queries do portal (`["portal"]` cobre notícias,
 *   views, categorias, banners e settings).
 * - No servidor, força a regeneração do ISR via Route Handler `/api/revalidate`.
 *   `resources` pede a invalidação das tags daqueles caches (`unstable_cache`);
 *   sem ele, o handler mantém o comportamento original (só as rotas).
 *   `urls` (paths internos, ex.: `/noticia/foo`) alimenta o ping do IndexNow —
 *   o buscador é avisado da URL exata que mudou.
 *
 * Fire-and-forget de propósito: uma falha aqui nunca pode quebrar a mutação —
 * o TTL de 5 min regenera o cache de qualquer forma.
 */
export function revalidatePortalCache(
  queryClient?: QueryClient,
  resources?: PortalResource[],
  urls?: string[]
): void {
  queryClient?.invalidateQueries({ queryKey: ["portal"] })

  const { token } = useAuthStore.getState()
  if (typeof window === "undefined" || !token) return

  const body: { resources?: PortalResource[]; urls?: string[] } = {}
  if (resources) body.resources = resources
  if (urls && urls.length > 0) body.urls = urls
  const hasBody = body.resources !== undefined || body.urls !== undefined

  void fetch(assetPath("/api/revalidate"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  }).catch(() => {})
}
