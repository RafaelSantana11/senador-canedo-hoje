/** Escape de texto para XML (sitemap, RSS): os cinco caracteres reservados
 *  viram entidades para o documento nunca quebrar com conteúdo editorial. */
export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
