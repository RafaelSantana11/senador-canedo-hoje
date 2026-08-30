"use client"

import { useEffect, useRef } from "react"
import { RefreshCw } from "lucide-react"
import { useNewsFeed } from "../contexts/news-feed-context"

// A quantos px do fim da lista o sentinela dispara o carregamento da próxima
// página — carrega um pouco antes de o usuário chegar ao fim.
const ROOT_MARGIN_PX = 300

export function InfiniteNewsFooter() {
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    loadedPages,
  } = useNewsFeed()

  // Bloqueia disparo duplicado enquanto um fetch está em andamento. Só é
  // tocado em effects/handlers (nunca durante o render).
  const busyRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const load = () => {
    if (busyRef.current || isFetchingNextPage) return
    busyRef.current = true
    void fetchNextPage().finally(() => {
      busyRef.current = false
    })
  }

  // Substitui a query string ?page={n} conforme as páginas vão sendo carregadas,
  // sem recarregar a página. Preserva "voltar" e deixa crawlers/links reais de
  // paginação como fallback.
  useEffect(() => {
    const nextPage = Math.max(loadedPages, 1)
    const url = new URL(window.location.href)
    if (nextPage === 1) {
      url.searchParams.delete("page")
    } else {
      url.searchParams.set("page", String(nextPage))
    }
    window.history.replaceState(window.history.state, "", url)
  }, [loadedPages])

  // IntersectionObserver: sentinela no fim da lista com rootMargin de ~300px
  // para pré-carregar a próxima página antes de o usuário chegar ao fim.
  useEffect(() => {
    const element = sentinelRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (busyRef.current || isFetchingNextPage) continue
          if (!hasNextPage) continue
          load()
        }
      },
      { rootMargin: `${ROOT_MARGIN_PX}px 0px` },
    )

    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load é redefinida a cada render
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Fim da lista: nada a carregar.
  if (!hasNextPage) {
    return (
      <p
        className="pt-10 text-center text-sm text-muted-foreground"
        aria-live="polite"
      >
        Você chegou ao fim das notícias publicadas.
      </p>
    )
  }

  return (
    <div className="pt-10" aria-live="polite" aria-busy={isFetchingNextPage}>
      {/* Sentinela: dispara o infinite scroll quando entra na viewport. */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      {isError ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar mais notícias.
            {error?.message ? ` (${error.message})` : ""}
          </p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
        </div>
      ) : isFetchingNextPage ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <span
            className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">
            Carregando mais notícias…
          </span>
        </div>
      ) : (
        /* Fallback: botão "Carregar mais" quando o IntersectionObserver não
           disparar (JS parcial, semântica de botão, crawlers seguem ?page=). */
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Carregar mais
          </button>
        </div>
      )}
    </div>
  )
}
