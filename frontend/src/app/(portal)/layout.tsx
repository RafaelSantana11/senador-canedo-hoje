import { PortalFooter } from "@/components/layout/portal-footer"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { JsonLd } from "@/components/seo/json-ld"
import { siteJsonLd } from "@/lib/structured-data"
import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Nome/logo/contato do JSON-LD vêm da mesma fonte do header/footer (cache de
  // 5 min); settings indisponível cai no default de build, como no root layout.
  const settings = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )

  return (
    <>
      <JsonLd data={siteJsonLd(settings)} />
      {children}
      <PortalFooter />
      {/* GA4 + banner de consentimento (LGPD) — apenas nas rotas do portal.
          /admin e /senadorlogin (painel editorial) não são instrumentados. */}
      <AnalyticsProvider />
    </>
  )
}
