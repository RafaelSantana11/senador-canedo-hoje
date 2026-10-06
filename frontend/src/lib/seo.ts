const defaultSiteUrl = "http://localhost:3001"

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  const url = new URL(configuredUrl)

  if (basePath && url.pathname === "/") {
    url.pathname = `${basePath.replace(/\/$/, "")}/`
  }

  return url
}

export function absoluteSiteUrl(path = "/") {
  const normalizedPath = path.replace(/^\/+/, "")
  return new URL(normalizedPath, getBaseUrl()).toString()
}

export function absoluteMediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (apiUrl) {
    return new URL(path, apiUrl).toString()
  }

  return absoluteSiteUrl(path)
}

export function getMetadataBase() {
  return getBaseUrl()
}

/** Imagem de compartilhamento padrão, servida pela rota /og. */
export const defaultOpenGraphImage = {
  url: absoluteSiteUrl("/og"),
  width: 1200,
  height: 630,
  alt: "Senador Canedo Hoje — Notícias em tempo real",
}

/** `alternates.types` com o feed RSS. O metadata do Next faz merge raso:
 *  quando uma página define o próprio `alternates` (canonical), o bloco
 *  inteiro do layout é substituído — por isso quem define canonical próprio
 *  precisa espalhar esta descoberta de novo. */
export const rssAlternateTypes = {
  "application/rss+xml": absoluteSiteUrl("/feed.xml"),
}
