import type { NextConfig } from "next"

// O portal é SSR + ISR (App Router). O deploy roda `next start` (ou `next build`
// num host serverless) — sem `output: "export"`. Só há um hook de compatibilidade:
// se NEXT_PUBLIC_BASE_PATH vier definido num deploy futuro numa subpath, o
// basePath/assetPrefix é aplicado; vazio por padrão.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const nextConfig: NextConfig = {
  ...(basePath && { basePath, assetPrefix: basePath }),
  // O Next infere o workspace root subindo a árvore de diretórios até achar um
  // lockfile (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lock). Se existir
  // um lockfile solto acima do projeto (ex.: na home do usuário), a inferência
  // erra a raiz e o Turbopack passa a escanear/apontar para o diretório errado.
  // Fixar em `frontend/` deixa o comportamento determinístico em qualquer máquina.
  // `__dirname` está disponível aqui porque o `next.config.ts` é transpilado para
  // CommonJS antes de ser carregado.
  turbopack: {
    root: __dirname,
  },
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
