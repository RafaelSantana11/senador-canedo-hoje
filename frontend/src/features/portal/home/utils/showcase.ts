import {
  readPosition,
  readPositionOrder,
  readUrgent,
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

// "Urgente" abre o feed: estável, para não trocar a ordem relativa dos demais
// nem reordenar cards já vistos quando uma página nova chega.
export function sortUrgentFirst(list: PublicNews[]): PublicNews[] {
  return [...list].sort(
    (a, b) => Number(readUrgent(b.config)) - Number(readUrgent(a.config))
  )
}

function slotItems(
  list: PublicNews[],
  position: PublicNewsPosition
): PublicNews[] {
  return list
    .filter((news) => readPosition(news.config) === position)
    .sort(
      (a, b) =>
        readPositionOrder(a.config) - readPositionOrder(b.config) ||
        recency(b) - recency(a)
    )
}

// Preenche `count` itens do primeiro pool que tiver id ainda não usado.
function fillFrom(
  pools: PublicNews[][],
  usedIds: Set<string>,
  count: number
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
  /** Quantos itens de `sawThis` vieram da primeira página (layout estável). */
  sawThisStableCount: number
}

/**
 * Deriva todas as seções da home de uma única listagem publicada, na ordem
 * editorial: hero → secundárias → grade → mais lidas → últimas.
 */
export function selectHomeSections(
  list: PublicNews[],
  stableList: PublicNews[] = list
): HomeSections {
  // As marcadas como "lateral" ("Viu isso?") saem do feed geral e das
  // "últimas": o pool "recent" usado pelas seções de conteúdo já as exclui.
  const recent = sortRecent(
    list.filter((n) => readPosition(n.config) !== "lateral")
  )

  // Infinite scroll must not reshuffle the visible composition when an older
  // page contains another editorial slot (for example, a second "destaque").
  // The first loaded page establishes the home layout; later pages extend the
  // feed instead of replacing cards already on screen.
  const stableRecent = sortRecent(
    stableList.filter((n) => readPosition(n.config) !== "lateral")
  )
  const hero =
    slotItems(stableList, "destaque")[0] ?? stableRecent[0] ?? recent[0] ?? null
  const heroIds = new Set(hero ? [hero.id] : [])

  const heroSecondary = fillFrom(
    [slotItems(stableList, "topo"), stableRecent],
    heroIds,
    HERO_SECONDARY_COUNT
  )

  const layoutIds = new Set([
    ...heroIds,
    ...heroSecondary.map((article) => article.id),
  ])

  // Grade principal: monta primeiro a ordem da página inicial e só depois
  // acrescenta notícias das páginas seguintes. Recalcular `feed` sobre a lista
  // inteira faria uma notícia antiga com positionOrder menor entrar no começo
  // e empurrar cards que o usuário já viu para outras posições.
  const initialFeatured = sortUrgentFirst(
    fillFrom(
      [slotItems(stableList, "feed"), stableRecent],
      layoutIds,
      Number.MAX_SAFE_INTEGER
    )
  )
  const featuredIds = new Set(initialFeatured.map((article) => article.id))
  const featured = [
    ...initialFeatured,
    ...list.filter((article) => {
      if (
        featuredIds.has(article.id) ||
        layoutIds.has(article.id) ||
        readPosition(article.config) === "lateral"
      ) {
        return false
      }
      featuredIds.add(article.id)
      return true
    }),
  ]

  const mostRead = fillFrom(
    [[...stableList].sort((a, b) => b.views - a.views)],
    new Set<string>(),
    MOST_READ_COUNT
  )
  // "Últimas notícias": agora apenas as realmente recentes. As marcadas como
  // "lateral" deixaram de ser pinadas aqui e ganharam a seção própria "Viu isso?".
  const latest = fillFrom([stableRecent], new Set(heroIds), LATEST_COUNT)
  // "Viu isso?": matérias marcadas como "lateral", na ordem definida no painel.
  const stableLateralIds = new Set(stableList.map((article) => article.id))
  const stableLateral = slotItems(stableList, "lateral")
  const sawThis = [
    ...stableLateral,
    ...slotItems(list, "lateral").filter(
      (article) => !stableLateralIds.has(article.id)
    ),
  ]

  return {
    hero,
    heroSecondary,
    featured,
    mostRead,
    latest,
    sawThis,
    sawThisStableCount: stableLateral.length,
  }
}
