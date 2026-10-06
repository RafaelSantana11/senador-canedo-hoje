/**
 * Invalidação on-demand do cache ISR do portal.
 *
 * O admin (client) chama depois de criar/editar/excluir notícia, categoria,
 * banner ou parâmetro. A autenticação reaproveita o access token do painel: o
 * token é validado contra o backend (`auth/me`) antes de qualquer revalidação —
 * sem isso o endpoint seria um vetor público de regeneração forçada.
 *
 * A home traz notícias, categorias (menu) e banners; o detalhe da notícia
 * também traz banners e a categoria. Invalidar as duas rotas cobre os três
 * recursos. A regeneração é preguiçosa (só na próxima visita), conforme o
 * contrato do `revalidatePath`.
 *
 * Corpo opcional `{ resources: ["settings"] }` invalida também a tag do
 * `unstable_cache` daquele recurso (`portal-cache.ts`). As tags implícitas das
 * rotas não bastam para os dados usados pelo root layout (settings valem para
 * todas as páginas, não só a home e o detalhe).
 */
import { revalidatePath, revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Tag do `unstable_cache` de cada recurso do portal. O feed de notícias não tem tag própria (é lido direto na home). */
const RESOURCE_TAGS: Record<string, string> = {
  categories: "portal:categories",
  banners: "portal:banners",
  settings: "portal:settings",
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

async function readResources(request: Request): Promise<string[]> {
  const body = (await request.json().catch(() => null)) as {
    resources?: unknown
  } | null
  if (!Array.isArray(body?.resources)) return []
  return body.resources.filter((item): item is string => typeof item === "string")
}

export async function POST(request: Request) {
  if (!(await hasValidAdminToken(request))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const resources = await readResources(request)

  revalidatePath("/")
  // O pattern precisa da estrutura real do arquivo, incluindo o route group:
  // a tag gravada no cache é `_N_T_/(portal)/noticia/[slug]/page`.
  revalidatePath("/(portal)/noticia/[slug]", "page")

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

  return Response.json({ ok: true, revalidatedAt: Date.now() })
}
