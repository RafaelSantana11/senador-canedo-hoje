"use client"

import { useEffect } from "react"
import { useSiteIdentityStore } from "@/stores/useSiteIdentityStore"

export function SiteIdentityHydrator() {
  const hydrate = useSiteIdentityStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return null
}
