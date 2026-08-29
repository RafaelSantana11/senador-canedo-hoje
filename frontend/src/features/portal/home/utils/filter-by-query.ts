import type { PublicNews } from "../types/news"

function normalize(text: string): string {
  return text.toLocaleLowerCase("pt-BR").trim()
}

// Busca na superfície visível de cada matéria: título, resumo, corpo,
// categoria, autor e tags. Casa substring simples, sem regex.
export function filterByQuery(
  list: PublicNews[],
  query: string,
): PublicNews[] {
  const q = normalize(query)
  if (!q) return list

  return list.filter((news) => {
    const haystack = [
      news.title,
      news.summary ?? "",
      news.body,
      news.category.name,
      news.author.name,
      ...news.tags.map((tag) => tag.name),
    ]
      .map(normalize)
      .join(" ")

    return haystack.includes(q)
  })
}