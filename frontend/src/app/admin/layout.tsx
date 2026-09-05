import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Painel Editorial",
  robots: { index: false, follow: false },
}

export { default } from "@/features/admin/pages/admin-layout"
