import { PortalFooter } from "@/components/layout/portal-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { siteJsonLd } from "@/lib/structured-data"
import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O nome do portal é configurável (`SITE_NAME`) e alimenta o JSON-LD de
  // Organization/WebSite de todas as páginas. Cache de 5 min; se as settings
  // falharem, vale o default de build.
  const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )

  return (
    <>
      <JsonLd data={siteJsonLd(siteName)} />
      {children}
      <PortalFooter />
    </>
  )
}
