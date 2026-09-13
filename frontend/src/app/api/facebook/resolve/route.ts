/**
 * Resolve links de compartilhamento do Facebook (`/share/p/...`,
 * `/share/v/...`) para o permalink canônico do post.
 *
 * O plugin de embed (`plugins/post.php`) não segue esses redirects, e o
 * browser não consegue ler o header `Location` por causa do CORS — por isso a
 * resolução acontece aqui, no servidor.
 */

const FACEBOOK_HOST_RE = /^(?:www\.|m\.|web\.)?facebook\.com$/i
const SHARE_PATH_RE = /^\/share\/[a-z0-9]+\/[A-Za-z0-9_-]+/i
const MAX_REDIRECTS = 5

// O Facebook responde 400 para clientes "não navegador"; estes headers imitam
// uma navegação real e fazem o link de share responder 302 com o permalink.
const NAVIGATION_HEADERS: HeadersInit = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,*/*;q=0.8",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
}

export const dynamic = "force-dynamic"

function isFacebookHost(host: string): boolean {
  return FACEBOOK_HOST_RE.test(host.toLowerCase())
}

async function resolveShareUrl(start: URL): Promise<string | null> {
  let current = start

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: NAVIGATION_HEADERS,
      cache: "no-store",
    })

    const location = response.headers.get("location")
    if (!location) return null

    const next = new URL(location, current)
    // Só seguimos redirects que continuam dentro do Facebook (anti-SSRF).
    if (!isFacebookHost(next.hostname)) return null

    if (!SHARE_PATH_RE.test(next.pathname)) {
      next.hash = ""
      return next.toString()
    }
    current = next
  }

  return null
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url")
  if (!raw) {
    return Response.json({ error: "missingUrl" }, { status: 400 })
  }

  let start: URL
  try {
    start = new URL(raw)
  } catch {
    return Response.json({ error: "invalidUrl" }, { status: 400 })
  }

  if (
    (start.protocol !== "https:" && start.protocol !== "http:") ||
    !isFacebookHost(start.hostname) ||
    !SHARE_PATH_RE.test(start.pathname)
  ) {
    return Response.json({ error: "invalidUrl" }, { status: 400 })
  }

  try {
    const resolved = await resolveShareUrl(start)
    if (!resolved) {
      return Response.json({ error: "notResolved" }, { status: 422 })
    }
    return Response.json({ url: resolved })
  } catch {
    return Response.json({ error: "resolveFailed" }, { status: 502 })
  }
}
