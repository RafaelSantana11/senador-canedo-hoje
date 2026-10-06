import { absoluteSiteUrl } from "@/lib/seo"

/**
 * Notifica o IndexNow (Bing/Copilot, Yandex, Seznam) sobre URLs novas ou
 * alteradas. No-op sem `INDEXNOW_KEY` configurada.
 *
 * A chave é servida em `/indexnow/<chave>.txt` (ver route handler) e apontada
 * como `keyLocation` no ping — isso dispensa publicar arquivo na raiz.
 *
 * Best-effort de propósito: o ping nunca pode derrubar a revalidação.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key || urls.length === 0) return

  try {
    const host = new URL(absoluteSiteUrl()).host
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: absoluteSiteUrl(`/indexnow/${key}.txt`),
        urlList: [...new Set(urls)],
      }),
      cache: "no-store",
    })
  } catch {
    // Sem IndexNow neste ambiente (ou API indisponível): segue o baile.
  }
}
