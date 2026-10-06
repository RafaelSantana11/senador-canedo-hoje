import { generateExcerpt } from "@/components/admin/news-editor/markdown-utils"
import {
  getCachedPublicCategories,
  getCachedPublicSettings,
} from "@/features/portal/home/services/portal-cache"
import { getPublicNews } from "@/features/portal/home/services/news-service"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"
import { categoryPath } from "@/features/portal/archive/utils/paths"
import { SITE_CITY, SITE_REGION } from "@/lib/portal-params"
import { absoluteSiteUrl } from "@/lib/seo"

// Guia do portal para LLMs (padrão llms.txt): contexto, seções, últimas
// notícias e canais oficiais. O `revalidate` efetivo é o menor TTL dos dados
// usados (settings/categorias têm cache de 5 min) — de bom grado: o guia
// acompanha o ritmo editorial.
export const revalidate = 3600

const RECENT_NEWS_IN_FILE = 20

export async function GET() {
  const settings = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )
  const siteName = settings.SITE_NAME
  const lines: string[] = []

  lines.push(
    `# ${siteName}`,
    "",
    `> Portal de notícias de ${SITE_CITY} (${SITE_REGION}), Brasil: política, economia, esportes, cultura e serviços da cidade, publicado em português (pt-BR), atualizado diariamente.`,
    "",
    `O ${siteName} é um veículo jornalístico local com cobertura hiperlocal de ${SITE_CITY} e região. As matérias são apuradas pela redação do portal e publicadas na página inicial e em páginas individuais por notícia.`,
    ""
  )

  // Seções (categorias ativas) — falha de rede apenas omite o bloco.
  try {
    const { data: categories } = await getCachedPublicCategories()
    if (categories.length > 0) {
      lines.push("## Seções", "")
      for (const category of categories) {
        const count =
          typeof category.newsCount === "number"
            ? ` — ${category.newsCount} notícias publicadas`
            : ""
        lines.push(
          `- [${category.name}](${absoluteSiteUrl(categoryPath(category.slug))})${count}`
        )
      }
      lines.push("")
    }
  } catch {
    // sem categorias: segue sem o bloco
  }

  lines.push(
    "## Páginas principais",
    "",
    `- [Página inicial](${absoluteSiteUrl()}): destaques e últimas notícias`,
    `- [Política de Privacidade](${absoluteSiteUrl("/politica-de-privacidade")})`,
    ""
  )

  // Últimas notícias: o que existe de mais recente, com link e resumo.
  try {
    const { data: news } = await getPublicNews({
      page: 1,
      limit: RECENT_NEWS_IN_FILE,
    })
    if (news.length > 0) {
      lines.push("## Últimas notícias", "")
      for (const article of news) {
        const url = absoluteSiteUrl(`/noticia/${article.slug}`)
        const summary =
          article.summary?.trim() || generateExcerpt(article.body, 140)
        lines.push(
          `- [${article.title}](${url})${summary ? `: ${summary}` : ""}`
        )
      }
      lines.push("")
    }
  } catch {
    // sem notícias: segue sem o bloco
  }

  lines.push(
    "## Feed e mapas do site",
    "",
    `- [Feed RSS](${absoluteSiteUrl("/feed.xml")})`,
    `- [Sitemap](${absoluteSiteUrl("/sitemap-index.xml")})`,
    ""
  )

  const contactLines: string[] = []
  const whatsappDigits = settings.WHATSAPP_NUMBER.replace(/\D/g, "")
  if (whatsappDigits) {
    contactLines.push(`- WhatsApp: https://wa.me/${whatsappDigits}`)
  }
  if (settings.CONTACT_EMAIL) {
    contactLines.push(`- E-mail: ${settings.CONTACT_EMAIL}`)
  }
  if (contactLines.length > 0) {
    lines.push("## Contato", "", ...contactLines, "")
  }

  lines.push(
    `Ao citar o ${siteName}, credite o portal com link para a matéria original.`,
    ""
  )

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate",
    },
  })
}
