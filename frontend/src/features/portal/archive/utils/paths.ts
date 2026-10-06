/**
 * URLs públicas dos hubs editoriais. Fonte única para sitemap, links internos
 * (artigo, llms.txt) e as próprias páginas — nunca montar a string à mão.
 */
export function categoryPath(slug: string) {
  return `/categoria/${slug}`
}

export function tagPath(slug: string) {
  return `/tag/${slug}`
}
