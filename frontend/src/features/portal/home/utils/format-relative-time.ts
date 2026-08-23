// "há 12 min", "há 1 h", "há 3 dias" — mesmo estilo do mock da home.
export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)

  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return days === 1 ? "há 1 dia" : `há ${days} dias`

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
