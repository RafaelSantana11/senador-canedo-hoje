/**
 * Invalidação on-demand do cache ISR do portal.
 *
 * O admin (client) chama depois de criar/editar/excluir notícia, categoria ou
 * banner. A autenticação reaproveita o access token do painel: o token é
 * validado contra o backend (`auth/me`) antes de qualquer revalidação — sem
 * isso o endpoint seria um vetor público de regeneração forçada.
 *
 * A home traz notícias, categorias (menu) e banners; o detalhe da notícia
 * também traz banners e a categoria. Invalidar as duas rotas cobre os três
 * recursos. A regeneração é preguiçosa (só na próxima visita), conforme o
 * contrato do `revalidatePath`.
 */
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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

export async function POST(request: Request) {
  if (!(await hasValidAdminToken(request))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  revalidatePath("/")
  // O pattern precisa da estrutura real do arquivo, incluindo o route group:
  // a tag gravada no cache é `_N_T_/(portal)/noticia/[slug]/page`.
  revalidatePath("/(portal)/noticia/[slug]", "page")

  return Response.json({ ok: true, revalidatedAt: Date.now() })
}
