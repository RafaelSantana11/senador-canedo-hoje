import { Inter, Merriweather } from "next/font/google"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { assetPath, cn } from "@/lib/utils"
import { Toaster } from "sonner"
import { absoluteSiteUrl, getMetadataBase } from "@/lib/seo"

const merriweatherHeading = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Senador Canedo Hoje — Notícias em tempo real",
  description:
    "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
  alternates: {
    canonical: absoluteSiteUrl(),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Senador Canedo Hoje",
    title: "Senador Canedo Hoje — Notícias em tempo real",
    description:
      "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
    url: absoluteSiteUrl(),
  },
  generator: "v0.app",
  // Metadata URLs are emitted verbatim — Next does not apply basePath here, so
  // these need assetPath or the favicons 404 on a subpath deploy.
  icons: {
    icon: [
      {
        url: assetPath("/icon-light-32x32.png"),
        media: "(prefers-color-scheme: light)",
      },
      {
        url: assetPath("/icon-dark-32x32.png"),
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: assetPath("/icon.svg"),
        type: "image/svg+xml",
      },
    ],
    apple: assetPath("/apple-icon.png"),
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
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
        {/* GA4 + banner de consentimento (LGPD). Só carrega em produção. */}
        <AnalyticsProvider />
      </body>
    </html>
  )
}
