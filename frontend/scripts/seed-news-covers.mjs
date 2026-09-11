#!/usr/bin/env node

/**
 * Semeia imagens de teste no portal usando as imagens de `public/news/*.png`:
 * - capas das notícias (match por palavra-chave no título);
 * - banners de teste (--with-banners / --banners-only): 3 middle, 2 top, 2 aside.
 *
 * As imagens são enviadas uma única vez para a API e reaproveitadas.
 *
 * Uso:
 *   node scripts/seed-news-covers.mjs [--dry-run] [--only-missing] [--status=published]
 *                                     [--with-banners] [--banners-only]
 *
 * Atenção: `--with-banners` apaga os banners existentes antes de recriar o kit
 * de teste (3 middle + 2 top + 2 aside).
 *
 * Credenciais: usa ADMIN_EMAIL/ADMIN_PASSWORD do ambiente ou de `backend/.env`.
 * API: usa API_URL do ambiente ou NEXT_PUBLIC_API_URL de `.env`.
 */

import { existsSync, readFileSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(here, "..")
const backendRoot = path.resolve(frontendRoot, "..", "backend")
const imagesDir = path.join(frontendRoot, "public", "news")

const flags = new Set(process.argv.slice(2))
const dryRun = flags.has("--dry-run")
const onlyMissing = flags.has("--only-missing")
const bannersOnly = flags.has("--banners-only")
const withBanners = bannersOnly || flags.has("--with-banners")
const status = [...flags]
  .find((flag) => flag.startsWith("--status="))
  ?.split("=")[1]

const BANNER_PLAN = [
  { position: "top", title: "Teste — Top 1", image: "politics-small.png" },
  { position: "top", title: "Teste — Top 2", image: "sports.png" },
  { position: "middle", title: "Teste — Middle 1", image: "hero-congress.png" },
  { position: "middle", title: "Teste — Middle 2", image: "video-1.png" },
  { position: "middle", title: "Teste — Middle 3", image: "video-2.png" },
  { position: "aside", title: "Teste — Aside 1", image: "world.png" },
  { position: "aside", title: "Teste — Aside 2", image: "video-3.png" },
]

function parseEnvFile(file) {
  const env = {}
  if (!existsSync(file)) return env
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s+#.*$/, "").trim()
    }
    env[match[1]] = value
  }
  return env
}

const frontendEnv = parseEnvFile(path.join(frontendRoot, ".env"))
const backendEnv = parseEnvFile(path.join(backendRoot, ".env"))

const API_URL = (
  process.env.API_URL ??
  frontendEnv.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "")
const API_ORIGIN = new URL(API_URL).origin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? backendEnv.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? backendEnv.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "✖ Defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente ou em backend/.env."
  )
  process.exit(1)
}

const KEYWORD_IMAGES = [
  {
    match: /(esporte|futebol|campeonato|atleta|\btimes?\b|\bjogos?\b|\bgols?\b)/i,
    file: "sports.png",
  },
  {
    match: /cultura|show|m[úu]sica|festival|cinema|teatro|arte/i,
    file: "culture.png",
  },
  { match: /sa[úu]de|hospital|vacina|cl[íi]nica|m[ée]dic/i, file: "health.png" },
  {
    match: /ambiente|reciclagem|clima|sustent[áa]|verde|polui[çc][ãa]o/i,
    file: "environment.png",
  },
  {
    match: /tecnolog|digital|internet|aplicativo|startup|inova[çc][ãa]o/i,
    file: "technology.png",
  },
  {
    match: /economia|mercado|financ|emprego|infla[çc][ãa]o|empresa|neg[óo]cio/i,
    file: "economy.png",
  },
  {
    match: /pol[íi]tica|senado|c[âa]mara|prefeitura|vereador|governo|elei[çc][ãa]o/i,
    file: "politics-small.png",
  },
  {
    match: /mundo|internacional|global|exterior/i,
    file: "world.png",
  },
]

async function api(pathname, { method = "GET", token, body } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${pathname}`, {
    method,
    headers,
    body: payload,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const detail = data?.errors
      ? JSON.stringify(data.errors)
      : (data?.message ?? response.statusText)
    throw new Error(`${method} ${pathname} → ${response.status}: ${detail}`)
  }
  return data
}

async function listPaginated(pathname, token, extraParams = {}) {
  const items = []
  let page = 1
  for (;;) {
    const params = new URLSearchParams({
      page: String(page),
      limit: "50",
      ...extraParams,
    })
    const result = await api(`${pathname}?${params}`, { token })
    items.push(...result.data)
    if (!result.hasNextPage) break
    page += 1
  }
  return items
}

function pickImage(title, index, fallbackPool) {
  for (const rule of KEYWORD_IMAGES) {
    if (rule.match.test(title)) return rule.file
  }
  return fallbackPool[index % fallbackPool.length]
}

async function coverExists(cover) {
  if (!cover?.path) return false
  const url = /^https?:\/\//.test(cover.path)
    ? cover.path
    : `${API_ORIGIN}${cover.path}`
  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

async function seedBanners({ token, ensureUploaded }) {
  const existing = await listPaginated("/banners", token)
  console.log(
    `→ ${existing.length} banner(s) existente(s) — substituindo pelo kit de teste.`
  )

  let removed = 0
  for (const banner of existing) {
    if (dryRun) {
      console.log(`  − (dry-run) removeria "${banner.title}" (${banner.position})`)
      continue
    }
    await api(`/banners/${banner.id}`, { method: "DELETE", token })
    removed += 1
    console.log(`  − removido "${banner.title}" (${banner.position})`)
  }

  let created = 0
  let failed = 0
  for (const entry of BANNER_PLAN) {
    if (dryRun) {
      console.log(`  + (dry-run) ${entry.position}: ${entry.image}`)
      continue
    }
    try {
      const file = await ensureUploaded(entry.image, "   ")
      await api("/banners", {
        method: "POST",
        token,
        body: {
          title: entry.title,
          advertiser: "Teste",
          position: entry.position,
          active: true,
          items: [
            { file: { id: file.id }, durationMs: 6000, linkUrl: null, order: 0 },
          ],
        },
      })
      created += 1
      console.log(`  + ${entry.position}: ${entry.image}`)
    } catch (error) {
      failed += 1
      console.error(`  ✖ ${entry.position} (${entry.image}): ${error.message}`)
    }
  }

  return { created, removed, failed }
}

async function main() {
  const available = (await readdir(imagesDir))
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort()
  if (available.length === 0) {
    console.error(`✖ Nenhuma imagem encontrada em ${imagesDir}`)
    process.exit(1)
  }

  const missingBannerImages = BANNER_PLAN.filter(
    (entry) => !available.includes(entry.image)
  )
  if (withBanners && missingBannerImages.length > 0) {
    console.error(
      `✖ Imagens do kit de banners ausentes em public/news: ${missingBannerImages
        .map((entry) => entry.image)
        .join(", ")}`
    )
    process.exit(1)
  }

  const fallbackPool = available.filter(
    (name) => !KEYWORD_IMAGES.some((rule) => rule.file === name)
  )

  console.log(`→ API: ${API_URL}`)
  console.log(`→ Imagens: ${available.length} em public/news`)
  if (dryRun) console.log("→ Modo dry-run: nada será enviado ou alterado.")
  if (withBanners) {
    console.log(
      `→ Banners: ${BANNER_PLAN.filter((entry) => entry.position === "middle").length} middle, ` +
        `${BANNER_PLAN.filter((entry) => entry.position === "top").length} top, ` +
        `${BANNER_PLAN.filter((entry) => entry.position === "aside").length} aside`
    )
  }

  const { token } = await api("/auth/email/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })

  const uploaded = new Map()
  const ensureUploaded = async (imageName, label = "  ") => {
    if (uploaded.has(imageName)) return uploaded.get(imageName)
    const buffer = await readFile(path.join(imagesDir, imageName))
    const form = new FormData()
    form.append("file", new Blob([buffer], { type: "image/png" }), imageName)
    const { file } = await api("/files/upload", {
      method: "POST",
      token,
      body: form,
    })
    uploaded.set(imageName, file)
    console.log(`${label} ↑ upload ${imageName} (${file.id})`)
    return file
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  if (bannersOnly) {
    console.log("\n→ Seed apenas de banners (--banners-only).")
  } else {
    const news = await listPaginated(
      "/news",
      token,
      status ? { status } : {}
    )
    console.log(
      `\n→ ${news.length} notícia(s) listada(s)${status ? ` (status=${status})` : ""}\n`
    )

    for (const [index, item] of news.entries()) {
      const label = `${String(index + 1).padStart(2)}/${news.length}`
      const imageName = pickImage(item.title, index, fallbackPool)

      try {
        if (onlyMissing && (await coverExists(item.cover))) {
          skipped += 1
          console.log(`${label} • pulando (capa ok) ${item.title}`)
          continue
        }

        if (dryRun) {
          console.log(`${label} • ${imageName} → ${item.title}`)
          continue
        }

        const file = await ensureUploaded(imageName, label)
        await api(`/news/${item.id}`, {
          method: "PATCH",
          token,
          body: { cover: { id: file.id } },
        })
        updated += 1
        console.log(`${label} ✓ ${imageName} → ${item.title}`)
      } catch (error) {
        failed += 1
        console.error(`${label} ✖ ${item.title}\n     ${error.message}`)
      }
    }
  }

  let bannerResult = { created: 0, removed: 0, failed: 0 }
  if (withBanners) {
    console.log("\n→ Banners...")
    bannerResult = await seedBanners({ token, ensureUploaded })
  }

  console.log("\nResumo:")
  if (!bannersOnly) {
    console.log(
      `  notícias: ${updated} atualizada(s), ${skipped} pulada(s), ${failed} falha(s)`
    )
  }
  if (withBanners) {
    console.log(
      `  banners: ${bannerResult.created} criado(s), ${bannerResult.removed} removido(s), ` +
        `${bannerResult.failed} falha(s)`
    )
  }
  console.log(`  uploads: ${uploaded.size}`)

  if (failed > 0 || bannerResult.failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error(`✖ ${error.message}`)
  process.exit(1)
})
