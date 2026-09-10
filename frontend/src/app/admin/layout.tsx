import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "Painel Editorial" },
  robots: { index: false, follow: false },
}

export { default } from "@/features/admin/pages/admin-layout"
