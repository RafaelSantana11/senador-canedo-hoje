import { getNewsViews } from "@/features/portal/news/services/news-views-service"

// Opções "puras" da contagem atual de views — sem diretiva "use client" para
// servirem tanto ao prefetch do Server Component (home) quanto ao hook no
// client, como em `news-infinite-options.ts`.
export const NEWS_VIEWS_KEY = ["portal", "news", "views"] as const

/**
 * Contagem atual das candidatas a "Mais lidas".
 *
 * O `views` embutido na listagem é o retrato do momento em que ela foi gerada e
 * congela junto com o cache (ISR + React Query). Esta query existe para ordenar
 * a seção pelo número de agora.
 *
 * O `staleTime` de 5 min é intencional: o valor chega hidratado do SSR e não
 * pode disparar um refetch logo no mount — isso reordenaria a lista depois do
 * primeiro paint. A atualidade vem do ISR da home, que regenera a cada 60 s.
 */
export function newsViewsOptions(ids: string[]) {
  const unique = [...new Set(ids)].sort()

  return {
    queryKey: [...NEWS_VIEWS_KEY, unique] as const,
    queryFn: () => getNewsViews(unique),
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
  }
}
