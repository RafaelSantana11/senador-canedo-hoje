import { Inter, Merriweather } from "next/font/google"
import type { Metadata, Viewport } from "next"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  noop,
} from "@tanstack/react-query"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { assetPath, cn } from "@/lib/utils"
import { Toaster } from "sonner"
import {
  absoluteSiteUrl,
  defaultOpenGraphImage,
  getMetadataBase,
  rssAlternateTypes,
} from "@/lib/seo"
import { portalSettingsOptions } from "@/features/portal/settings/services/settings-options"
import { getCachedPublicSettings } from "@/features/portal/home/services/portal-cache"
import { DEFAULT_PORTAL_SETTINGS } from "@/features/portal/settings/types"

const merriweatherHeading = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export async function generateMetadata(): Promise<Metadata> {
  // O nome do portal é configurável (`SITE_NAME`) e alimenta o <title> e o
  // OpenGraph das páginas sem metadata própria. Mesmo cache de 5 min usado no
  // prefetch abaixo; se as settings falharem, vale o default de build.
  const { SITE_NAME: siteName } = await getCachedPublicSettings().catch(
    () => DEFAULT_PORTAL_SETTINGS
  )

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: `${siteName} — Notícias em tempo real`,
      template: `%s — ${siteName}`,
    },
    description:
      "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
    alternates: {
      canonical: absoluteSiteUrl(),
      types: rssAlternateTypes,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName,
      title: `${siteName} — Notícias em tempo real`,
      description:
        "Cobertura completa de política, economia, tecnologia, esportes e cultura. Jornalismo confiável e atualizado 24 horas por dia.",
      url: absoluteSiteUrl(),
      images: [
        {
          ...defaultOpenGraphImage,
          alt: `${siteName} — Notícias em tempo real`,
        },
      ],
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
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0b2a5b",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Parâmetros do portal (nome, logo, WhatsApp, contato e as contagens da home)
  // já chegam no HTML: a query é hidratada com o cache de 5 min do servidor, e
  // header, footer, home, login e painel leem a mesma fonte — sem flash do nome
  // padrão e sem request por componente. Falha aqui não derruba a página: o
  // client refaz a busca e, até ela chegar, valem os defaults de build.
  const queryClient = new QueryClient()
  await queryClient
    .prefetchQuery(portalSettingsOptions(getCachedPublicSettings))
    .catch(noop)

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
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ThemeProvider>{children}</ThemeProvider>
          </HydrationBoundary>
        </Providers>
        {/* GA4 + banner de consentimento (LGPD). Só carrega em produção. */}
        <AnalyticsProvider />
      </body>
    </html>
  )
}
