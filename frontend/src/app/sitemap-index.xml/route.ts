import { getSitemapIds } from "@/features/portal/home/services/sitemap-service"
import { absoluteSiteUrl } from "@/lib/seo"

export const revalidate = 3600

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// O Next não gera o índice automaticamente quando o sitemap usa
// `generateSitemaps` — os arquivos ficam em /sitemap/[id].xml e este route
// handler publica o índice em /sitemap-index.xml.
export async function GET() {
  const ids = await getSitemapIds()
  const sitemaps = ids
    .map(
      (id) =>
        `  <sitemap><loc>${escapeXml(absoluteSiteUrl(`/sitemap/${id}.xml`))}</loc></sitemap>`
    )
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate",
    },
  })
}
