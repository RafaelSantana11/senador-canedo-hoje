import { PortalFooter } from "@/components/layout/portal-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { siteJsonLd } from "@/lib/structured-data"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={siteJsonLd()} />
      {children}
      <PortalFooter />
    </>
  )
}
