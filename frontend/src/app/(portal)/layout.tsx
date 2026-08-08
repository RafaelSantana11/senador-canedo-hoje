import { PortalFooter } from "@/components/layout/portal-footer"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <PortalFooter />
    </>
  )
}
