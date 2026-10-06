/**
 * Invalidação on-demand do cache ISR do portal.
 *
 * O admin (client) chama depois de criar/editar/excluir notícia, categoria,
 * tag, banner ou parâmetro. A autenticação reaproveita o access token do
 * painel: o token é validado contra o backend (`auth/me`) antes de qualquer
 * revalidação — sem isso o endpoint seria um vetor público de regeneração
 * forçada.
 *
 * A home traz notícias, categorias (menu) e banners; o detalhe da notícia
 * também traz banners e a categoria. Invalidar as duas rotas cobre os três
 * recursos. Feed RSS, llms.txt, hubs de categoria/tag e news sitemap entram
 * junto: publicar/editar notícia precisa chegar na hora a agregadores e
 * crawlers de IA. A regeneração é preguiçosa (só na próxima visita), conforme
 * o contrato do `revalidatePath`.
 *
 * Corpo opcional `{ resources: ["settings"] }` invalida também a tag do
 * `unstable_cache` daquele recurso (`portal-cache.ts`). As tags implícitas das
 * rotas não bastam para os dados usados pelo root layout (settings valem para
 * todas as páginas, não só a home e o detalhe). `{ urls: ["/noticia/x"] }`
 * alimenta o ping do IndexNow com a URL exata que mudou.
 */
import { revalidatePath, revalidateTag } from "next/cache"
import { absoluteSiteUrl } from "@/lib/seo"
import { pingIndexNow } from "@/services/indexnow"

export const dynamic = "force-dynamic"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Tag do `unstable_cache` de cada recurso do portal (`portal-cache.ts`). */
const RESOURCE_TAGS: Record<string, string> = {
  categories: "portal:categories",
  tags: "portal:tags",
  banners: "portal:banners",
  settings: "portal:settings",
}

type RevalidateBody = {
  resources?: unknown
  urls?: unknown
}

async function hasValidAdminToken(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization")
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token || !API_URL) return false

  try {
    const response = await fetch(`${API_URL}auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    return response.ok
  } catch {
    return false
  }
}

/** O body é lido uma única vez — `request.json()` não pode ser chamado duas. */
async function readBody(request: Request): Promise<RevalidateBody | null> {
  return (await request.json().catch(() => null)) as RevalidateBody | null
}

function readResources(body: RevalidateBody | null): string[] {
  if (!Array.isArray(body?.resources)) return []
  return body.resources.filter(
    (item): item is string => typeof item === "string"
  )
}

/** Só paths internos — o ping do IndexNow aceita apenas URLs do próprio host. */
function readUrls(body: RevalidateBody | null): string[] {
  if (!Array.isArray(body?.urls)) return []
  return body.urls
    .filter(
      (item): item is string => typeof item === "string" && item.startsWith("/")
    )
    .slice(0, 20)
}

export async function POST(request: Request) {
  if (!(await hasValidAdminToken(request))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const body = await readBody(request)
  const resources = readResources(body)
  const urls = readUrls(body)

  revalidatePath("/")
  // O pattern precisa da estrutura real do arquivo, incluindo o route group:
  // a tag gravada no cache é `_N_T_/(portal)/noticia/[slug]/page`.
  revalidatePath("/(portal)/noticia/[slug]", "page")

  // Hubs editoriais e rotas de descoberta com TTL próprio: regeneram junto com
  // a publicação para refletirem a matéria nova na próxima visita.
  revalidatePath("/(portal)/categoria/[slug]", "page")
  revalidatePath("/(portal)/tag/[slug]", "page")
  revalidatePath("/feed.xml")
  revalidatePath("/llms.txt")
  revalidatePath("/news-sitemap.xml")

  for (const resource of resources) {
    const tag = RESOURCE_TAGS[resource]
    // `{ expire: 0 }`: sem janela de stale — o próximo request já regenera.
    // O default recomendado (`"max"`) serviria o valor antigo enquanto
    // revalida em background, o que não serve para parâmetro global.
    if (tag) revalidateTag(tag, { expire: 0 })
  }

  // Settings vivem no root layout: além da tag, o HTML de todas as páginas
  // precisa ser regenerado (inclusive as estáticas, que não têm `revalidate`).
  if (resources.includes("settings")) {
    revalidatePath("/", "layout")
  }

  // Best-effort: avisa o IndexNow (Bing/Copilot). A home muda a cada
  // publicação; `urls` acrescenta a notícia específica quando o admin sabe.
  await pingIndexNow([
    absoluteSiteUrl(),
    ...urls.map((url) => absoluteSiteUrl(url)),
  ])

  return Response.json({ ok: true, revalidatedAt: Date.now() })
}
