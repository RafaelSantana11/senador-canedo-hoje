import {
  readPosition,
  readPositionOrder,
  type PublicNews,
  type PublicNewsPosition,
} from "../types/news"

// Quem monta a home é o cliente (§4.1): o servidor só devolve published
// ordenado por publishedAt DESC. Slots exclusivos: destaque, topo, rodape.
// Aceitam vários: feed, lateral.

const HERO_SECONDARY_COUNT = 2
const FEATURED_COUNT = 8
const MOST_READ_COUNT = 5
const LATEST_COUNT = 5

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
}

/**
 * Deriva todas as seções da home de uma única listagem publicada, na ordem
 * editorial: hero → secundárias → grade → mais lidas → últimas. Cada seção
 * consome o que sobrou das anteriores; com acervo pequeno as listas encolhem.
 */
export function selectHomeSections(list: PublicNews[]): HomeSections {
  const recent = sortRecent(list)

  const hero = slotItems(list, "destaque")[0] ?? recent[0] ?? null
  const usedIds = new Set(hero ? [hero.id] : [])

  const heroSecondary = fillFrom(
    [slotItems(list, "topo"), recent],
    usedIds,
    HERO_SECONDARY_COUNT,
  )
  const featured = fillFrom(
    [slotItems(list, "feed"), recent],
    usedIds,
    FEATURED_COUNT,
  )
  const mostRead = fillFrom(
    [[...list].sort((a, b) => b.views - a.views)],
    usedIds,
    MOST_READ_COUNT,
  )
  const latest = fillFrom([slotItems(list, "lateral"), recent], usedIds, LATEST_COUNT)

  return { hero, heroSecondary, featured, mostRead, latest }
}
