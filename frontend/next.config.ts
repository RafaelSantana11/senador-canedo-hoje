import type { NextConfig } from "next"

// Static export is opt-in via env (NEXT_OUTPUT=export) so `next dev`, `next start`
// and a future SSR deploy keep working untouched. Only the GitHub Pages build
// sets it — see .github/workflows/deploy-frontend-pages.yml.
const isStaticExport = process.env.NEXT_OUTPUT === "export"

// GitHub Pages serves project sites from https://<user>.github.io/<repo>, so every
// asset and route needs that prefix. Empty everywhere else.
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
  ...(isStaticExport && {
    output: "export",
    // Pages is a dumb file server: no /_next/image endpoint to optimize on demand.
    // The custom loader serves the original file and keeps basePath applied —
    // `unoptimized: true` would bypass it and 404 every image on a subpath.
    images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
    // Emits out/login/index.html instead of out/login.html, which is what Pages
    // resolves reliably for /login and /admin/noticias.
    trailingSlash: true,
  }),
}

export default nextConfig
