import type { NextConfig } from "next"

// O portal é SSR + ISR (App Router). O deploy roda `next start` (ou `next build`
// num host serverless) — sem `output: "export"`. Só há um hook de compatibilidade:
// se NEXT_PUBLIC_BASE_PATH vier definido num deploy futuro numa subpath, o
// basePath/assetPrefix é aplicado; vazio por padrão.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const nextConfig: NextConfig = {
  ...(basePath && { basePath, assetPrefix: basePath }),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig
