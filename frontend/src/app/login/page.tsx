import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Painel Editorial",
  robots: { index: false, follow: false },
}

export { default } from "@/features/admin/auth/pages/login-page"
