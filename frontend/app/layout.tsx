import { Inter, Merriweather } from "next/font/google"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

const merriweatherHeading = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Senador Canedo Hoje — Notícias em tempo real",
  description:
    "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0b2a5b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "light font-sans",
        inter.variable,
        merriweatherHeading.variable
      )}
    >
      <body className="font-sans antialiased">
        <Toaster position="top-center" richColors />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
