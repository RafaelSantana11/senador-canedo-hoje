import {
  readPosition,
  readPositionOrder,
  type PublicNews,
  type PublicNewsPosition,
} from "../types/news"
import {
  HERO_SECONDARY_COUNT,
  MOST_READ_COUNT,
  LATEST_COUNT,
} from "@/lib/portal-params"

// Quem monta a home é o cliente (§4.1): o servidor só devolve published
// ordenado por publishedAt DESC. Slots exclusivos: destaque, topo, rodape.
// Aceitam vários: feed, lateral.

function recency(news: PublicNews): number {
  return Date.parse(news.publishedAt ?? news.createdAt)
}

function sortRecent(list: PublicNews[]): PublicNews[] {
  return [...list].sort((a, b) => recency(b) - recency(a))
}

function slotItems(
  list: PublicNews[],
  position: PublicNewsPosition,
): PublicNews[] {
  return list
    .filter((news) => readPosition(news.config) === position)
    .sort(
      (a, b) =>
        readPositionOrder(a.config) - readPositionOrder(b.config) ||
        recency(b) - recency(a),
    )
}

// Preenche `count` itens do primeiro pool que tiver id ainda não usado.
function fillFrom(
  pools: PublicNews[][],
  usedIds: Set<string>,
  count: number,
): PublicNews[] {
  const picked: PublicNews[] = []
  for (const pool of pools) {
    for (const news of pool) {
      if (picked.length >= count) return picked
      if (usedIds.has(news.id)) continue
      picked.push(news)
      usedIds.add(news.id)
    }
  }
  return picked
}

export type HomeSections = {
  hero: PublicNews | null
  heroSecondary: PublicNews[]
  featured: PublicNews[]
  mostRead: PublicNews[]
  latest: PublicNews[]
  sawThis: PublicNews[]
}

/**
 * Deriva todas as seções da home de uma única listagem publicada, na ordem
 * editorial: hero → secundárias → grade → mais lidas → últimas.
 */
export function selectHomeSections(list: PublicNews[]): HomeSections {
  // As marcadas como "lateral" ("Viu isso?") saem do feed geral e das
  // "últimas": o pool "recent" usado pelas seções de conteúdo já as exclui.
  const recent = sortRecent(
    list.filter((n) => readPosition(n.config) !== "lateral"),
  )

  const hero = slotItems(list, "destaque")[0] ?? recent[0] ?? null
  const heroIds = new Set(hero ? [hero.id] : [])

  const heroSecondary = fillFrom(
    [slotItems(list, "topo"), recent],
    heroIds,
    HERO_SECONDARY_COUNT,
  )

  // Grade principal: TODAS as notícias que não entraram no hero/secundárias,
  // priorizando as marcadas como "feed" e completando com as mais recentes.
  // Usa um Set próprio para não esvaziar as seções da sidebar.
  const featured = fillFrom(
    [slotItems(list, "feed"), recent],
    new Set(heroIds),
    Number.MAX_SAFE_INTEGER,
  )

  const mostRead = fillFrom(
    [[...list].sort((a, b) => b.views - a.views)],
    new Set<string>(),
    MOST_READ_COUNT,
  )
  // "Últimas notícias": agora apenas as realmente recentes. As marcadas como
  // "lateral" deixaram de ser pinadas aqui e ganharam a seção própria "Viu isso?".
  const latest = fillFrom(
    [recent],
    new Set(heroIds),
    LATEST_COUNT,
  )
  // "Viu isso?": matérias marcadas como "lateral", na ordem definida no painel.
  const sawThis = slotItems(list, "lateral")

  return { hero, heroSecondary, featured, mostRead, latest, sawThis }
}
