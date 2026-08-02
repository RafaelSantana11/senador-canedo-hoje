"use client"

import { usePathname } from "next/navigation"
import { SiteFooter } from "@/features/admin/news/components/site-footer"

export function PortalFooter() {
  const pathname = usePathname()
  const full = pathname === "/"
  return <SiteFooter variant={full ? "full" : "compact"} />
}
