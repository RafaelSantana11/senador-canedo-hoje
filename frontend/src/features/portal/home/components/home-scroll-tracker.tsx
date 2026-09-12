"use client"

import { useEffect } from "react"
import { trackScrollDepth } from "@/lib/gtag"

const THRESHOLDS: [25, 50, 75, 100] = [25, 50, 75, 100]

// scroll_depth — mede quanto da home foi rolada (25/50/75/100%).
// Cada marco é enviado uma única vez por visita. A página da matéria não
// envia esse evento; só a home o rastreia.
export function HomeScrollTracker() {
  useEffect(() => {
    const reported = new Set<number>()
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      const percent = Math.min(100, Math.round((window.scrollY / total) * 100))
      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !reported.has(threshold)) {
          reported.add(threshold)
          trackScrollDepth(threshold)
        }
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return null
}
