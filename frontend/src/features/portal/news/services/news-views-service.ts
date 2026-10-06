import { publicApi } from "@/services/api"
import type { NewsViewCount } from "../types/news"

// Contagem de leituras tem rotas próprias: `GET /news/:slug` é leitura pura e
// idempotente (o portal serve o detalhe por ISR — contar ali mediria
// regeneração de cache, não visita), e o `views` embutido em listagem/detalhe
// é o retrato do momento em que aquela resposta foi gerada.
//
//   GET  /news/views?ids=  → contagem atual em lote (só publicadas)
//   POST /news/:id/views   → registra UMA leitura e devolve a contagem nova
//
// As duas rotas são públicas: `publicApi` não anexa token.

/** Teto do contrato: acima disso o servidor recusa a requisição inteira. */
const NEWS_VIEWS_MAX_IDS = 100

/**
 * Registra **uma** leitura. Não é idempotente — cada chamada conta —, então
 * quem chama precisa garantir uma chamada por visita (`useRegisterNewsView`).
 * Rascunho, arquivada ou inexistente responde `404`.
 */
export async function registerNewsView(id: string): Promise<NewsViewCount> {
  const { data } = await publicApi.post<NewsViewCount>(
    `news/${encodeURIComponent(id)}/views`,
  )
  return data
}

/**
 * Contagem atual em lote, para exibir/ordenar sem o retrato congelado das
 * listagens cacheadas. Só notícias publicadas voltam; id ausente da resposta
 * saiu da vitrine (não vira `0` nem erro).
 */
export async function getNewsViews(ids: string[]): Promise<NewsViewCount[]> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return []

  const { data } = await publicApi.get<{ data: NewsViewCount[] }>(
    "news/views",
    { params: { ids: unique.slice(0, NEWS_VIEWS_MAX_IDS).join(",") } },
  )
  return data.data
}
