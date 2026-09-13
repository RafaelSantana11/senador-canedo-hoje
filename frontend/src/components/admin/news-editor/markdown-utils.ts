/**
 * Shared markdown utilities for the news editor.
 *
 * - `renderMarkdown`  – converts markdown source into safe HTML for preview
 * - `htmlToMarkdown`  – converts rich-editor HTML back into markdown
 * - `generateExcerpt` – strips markdown syntax and returns a plain-text excerpt
 * - Posts do Instagram/Facebook são guardados como `@[instagram](url)` /
 *   `@[facebook](url)` e viram o embed oficial na página pública (no editor
 *   aparece um cartão inerte com botão de remover).
 */

/* ─── Social embeds (Instagram / Facebook) ───────────────────────── */

export type EmbedKind = "instagram" | "facebook"

const EMBED_DIRECTIVE_RE = /^@\[(instagram|facebook)\]\((\S+)\)$/

const INSTAGRAM_URL_RE =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/

const FACEBOOK_HOST_RE = /^(?:www\.|m\.|web\.)?facebook\.com$/i

/** Parâmetros de rastreio que não mudam o post — removidos do link salvo. */
const FACEBOOK_TRACKING_PARAMS = [
  "mibextid",
  "rdid",
  "share_url",
  "extid",
  "paipv",
  "eav",
  "_rdr",
  "__cft__[0]",
  "__tn__",
]

const EMBED_META: Record<
  EmbedKind,
  { label: string; badge: string; badgeClass: string; attr: string }
> = {
  instagram: {
    label: "Post do Instagram",
    badge: "IG",
    badgeClass: "bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
    attr: "data-instagram-url",
  },
  facebook: {
    label: "Post do Facebook",
    badge: "FB",
    badgeClass: "bg-[#1877f2]",
    attr: "data-facebook-url",
  },
}

/**
 * Aceita links de post, Reel ou IGTV (com ou sem `www`, com parâmetros de
 * rastreio ou caminhos extras como `/embed/`) e devolve o permalink canônico.
 * Fora desse formato retorna `null` — nunca incorporamos URL arbitrária.
 */
export function parseInstagramUrl(raw: string): string | null {
  const match = raw.trim().match(INSTAGRAM_URL_RE)
  if (!match) return null
  const type = match[1] === "reels" ? "reel" : match[1]
  return `https://www.instagram.com/${type}/${match[2]}/`
}

/**
 * Aceita posts, vídeos, Reels, fotos e links curtos (`fb.watch`) do Facebook e
 * devolve a URL normalizada (host `www`, sem parâmetros de rastreio). Qualquer
 * coisa fora do domínio do Facebook retorna `null`.
 */
export function parseFacebookUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null

  const host = url.hostname.toLowerCase()
  const isShort = host === "fb.watch"
  if (!isShort && !FACEBOOK_HOST_RE.test(host)) return null

  const path = url.pathname.replace(/\/+$/, "")
  const isContent =
    /\/(posts|videos|photos)\//.test(path) ||
    /\/(permalink\.php|story\.php|photo\.php|photo|watch)$/.test(path) ||
    /^\/reel\/\d+/.test(path)
  if (!isShort && !isContent) return null

  // `/pagina/posts/algum-slug/123456` → `/pagina/posts/123456`: o plugin do
  // Facebook não resolve a forma "bonita" com slug.
  url.pathname = url.pathname.replace(
    /\/(posts|videos)\/(?:[^/]+\/)+?(\d+)\/?$/,
    "/$1/$2"
  )

  url.protocol = "https:"
  if (!isShort) url.hostname = "www.facebook.com"
  for (const key of FACEBOOK_TRACKING_PARAMS) url.searchParams.delete(key)
  url.hash = ""
  return url.toString()
}

/** Bloco de markdown que representa um post incorporado. */
export function embedDirective(kind: EmbedKind, url: string): string {
  return `@[${kind}](${url})`
}

/**
 * Cartão inerte mostrado **dentro do editor** (o post real só é carregado na
 * pré-visualização e na página pública, para o contentEditable não quebrar).
 * O botão `.embed-remove` é tratado por delegação de evento no editor.
 */
export function embedPlaceholderHtml(kind: EmbedKind, url: string): string {
  const meta = EMBED_META[kind]
  return (
    `<div class="${kind}-embed my-3 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-3.5 py-3"` +
    ` ${meta.attr}="${url}" contenteditable="false">` +
    `<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.badgeClass} text-[10px] font-bold text-white">${meta.badge}</span>` +
    `<span class="flex min-w-0 flex-1 flex-col">` +
    `<span class="text-xs font-semibold text-foreground">${meta.label}</span>` +
    `<span class="truncate text-xs text-muted-foreground">${url}</span>` +
    `</span>` +
    `<button type="button" class="embed-remove inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive hover:text-white"` +
    ` aria-label="Remover ${meta.label.toLowerCase()}" title="Remover">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-3.5 w-3.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>` +
    `</button>` +
    `</div>`
  )
}

/** Markup oficial do Instagram (blockquote processado pelo embed.js). */
function instagramEmbedHtml(url: string): string {
  return (
    `<div class="instagram-embed my-6 flex justify-center" data-instagram-url="${url}">` +
    `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${url}" data-instgrm-version="14"` +
    ` style="background:#FFF;border:0;border-radius:12px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:326px;padding:0;width:calc(100% - 2px);">` +
    `<div style="padding:16px;"><a href="${url}" target="_blank" rel="noopener noreferrer">Ver este post no Instagram</a></div>` +
    `</blockquote></div>`
  )
}

/**
 * Iframe oficial do plugin do Facebook (não exige SDK nem appId; o SDK
 * falhava sem `appId` em alguns ambientes). A altura é fixa porque o plugin
 * não comunica o próprio tamanho sem o SDK — posts longos rolam dentro do
 * iframe em vez de serem cortados.
 */
function facebookEmbedHtml(url: string): string {
  const isVideo =
    url.includes("fb.watch") ||
    url.includes("/videos/") ||
    url.includes("/watch") ||
    url.includes("/reel/")
  const plugin = isVideo ? "video.php" : "post.php"
  const height = isVideo ? 500 : 700
  const src =
    `https://www.facebook.com/plugins/${plugin}?href=` +
    `${encodeURIComponent(url)}&show_text=true&width=552`

  return (
    `<div class="facebook-embed my-6 flex justify-center" data-facebook-url="${url}">` +
    `<iframe src="${src}" width="552" height="${height}"` +
    ` style="border:none;max-width:100%;border-radius:12px;background:#fff"` +
    ` frameborder="0" allowfullscreen="true" loading="lazy"` +
    ` allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"` +
    ` title="Post do Facebook"></iframe>` +
    `</div>`
  )
}

/**
 * Lê o provedor e a URL de um embed já renderizado (cartão do editor,
 * blockquote do Facebook ou iframe do Instagram/plugin).
 */
function readEmbed(el: HTMLElement): { kind: EmbedKind; url: string } | null {
  const instagramRaw =
    el.getAttribute("data-instagram-url") ??
    el.getAttribute("data-instgrm-permalink")
  if (instagramRaw) {
    const url = parseInstagramUrl(instagramRaw)
    if (url) return { kind: "instagram", url }
  }

  const facebookRaw =
    el.getAttribute("data-facebook-url") ??
    el.getAttribute("data-href") ??
    el.getAttribute("cite")
  if (facebookRaw) {
    const url = parseFacebookUrl(facebookRaw)
    if (url) return { kind: "facebook", url }
  }

  if (el.tagName.toLowerCase() === "iframe") {
    const src = el.getAttribute("src") ?? ""
    const instagramUrl = parseInstagramUrl(src)
    if (instagramUrl) return { kind: "instagram", url: instagramUrl }
    try {
      const href = new URL(src).searchParams.get("href")
      const facebookUrl = href ? parseFacebookUrl(href) : null
      if (facebookUrl) return { kind: "facebook", url: facebookUrl }
    } catch {
      // src inválida: não é um embed conhecido
    }
  }
  return null
}

/* ─── Markdown → HTML (safe) ─────────────────────────────────────── */

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function inline(s: string) {
  return escape(s)
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(
      /&lt;u&gt;(.*?)&lt;\/u&gt;/g,
      "<u>$1</u>"
    )
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      '<img src="$2" alt="$1" class="mt-2 rounded-md max-w-full" />'
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="text-primary underline">$1</a>'
    )
}

/**
 * Opções do renderizador de markdown.
 */
export type MarkdownRenderOptions = {
  /**
   * `"embed"` (padrão) gera o post real para pré-visualização/página pública;
   * `"placeholder"` gera o cartão inerte usado dentro do editor.
   */
  embeds?: "embed" | "placeholder"
}

/**
 * Minimal safe markdown renderer.
 * Escapes HTML first, then applies block/inline markdown rules.
 * Supports: headings (h1-h3), bold, italic, inline code, links, images,
 * blockquotes, unordered/ordered lists, horizontal rules, paragraphs and
 * Instagram/Facebook embeds (`@[instagram](url)`, `@[facebook](url)`).
 */
export function renderMarkdown(
  src: string,
  options: MarkdownRenderOptions = {}
): string {
  const embeds = options.embeds ?? "embed"
  const lines = src.split("\n")
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push('<hr class="my-4 border-border" />')
      i++
    }
    // Social embed (Instagram / Facebook)
    else if (EMBED_DIRECTIVE_RE.test(line.trim())) {
      const match = line.trim().match(EMBED_DIRECTIVE_RE)!
      const kind = match[1] as EmbedKind
      const rawUrl = match[2]
      const url =
        kind === "instagram" ? parseInstagramUrl(rawUrl) : parseFacebookUrl(rawUrl)
      out.push(
        url
          ? embeds === "placeholder"
            ? embedPlaceholderHtml(kind, url)
            : kind === "instagram"
              ? instagramEmbedHtml(url)
              : facebookEmbedHtml(url)
          : `<p class="mt-3">${inline(line.trim())}</p>`
      )
      i++
    }
    // H1
    else if (/^#\s+/.test(line)) {
      out.push(
        `<h1 class="mt-4 text-2xl font-bold">${inline(line.replace(/^#\s+/, ""))}</h1>`
      )
      i++
    }
    // H2
    else if (/^##\s+/.test(line)) {
      out.push(
        `<h2 class="mt-4 text-xl font-semibold">${inline(line.replace(/^##\s+/, ""))}</h2>`
      )
      i++
    }
    // H3
    else if (/^###\s+/.test(line)) {
      out.push(
        `<h3 class="mt-3 text-lg font-semibold">${inline(line.replace(/^###\s+/, ""))}</h3>`
      )
      i++
    }
    // Blockquote
    else if (/^>\s?/.test(line)) {
      out.push(
        `<blockquote class="mt-3 border-l-2 border-border pl-3 italic text-muted-foreground">${inline(line.replace(/^>\s?/, ""))}</blockquote>`
      )
      i++
    }
    // Unordered list
    else if (/^-\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^-\s+/, ""))}</li>`)
        i++
      }
      out.push(`<ul class="mt-2 list-disc pl-5">${items.join("")}</ul>`)
    }
    // Ordered list
    else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`)
        i++
      }
      out.push(`<ol class="mt-2 list-decimal pl-5">${items.join("")}</ol>`)
    }
    // Empty line
    else if (line.trim() === "") {
      out.push("")
      i++
    }
    // Paragraph
    else {
      out.push(`<p class="mt-3">${inline(line)}</p>`)
      i++
    }
  }
  return out.join("\n")
}

/* ─── HTML → Markdown (rich editor) ──────────────────────────────── */

function inlineToMarkdown(node: Node): string {
  let out = ""
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      out += (child as Text).textContent ?? ""
      return
    }
    if (child.nodeType !== 1) return
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()
    const embed = readEmbed(el)
    if (embed) {
      out += `\n\n${embedDirective(embed.kind, embed.url)}\n\n`
      return
    }
    const inner = inlineToMarkdown(el)
    switch (tag) {
      case "strong":
      case "b":
        out += `**${inner}**`
        break
      case "em":
      case "i":
        out += `*${inner}*`
        break
      case "u":
        out += `<u>${inner}</u>`
        break
      case "s":
      case "del":
      case "strike":
        out += `~~${inner}~~`
        break
      case "mark":
        out += `==${inner}==`
        break
      case "code":
        out += `\`${inner}\``
        break
      case "a": {
        const href = el.getAttribute("href") ?? ""
        out += `[${inner}](${href})`
        break
      }
      case "br":
        out += "  \n"
        break
      case "img":
        out += `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})`
        break
      case "span": {
        // Preserve colored text / highlighted text from execCommand
        const style = el.getAttribute("style") ?? ""
        if (style.includes("background-color")) {
          out += `==${inner}==`
        } else {
          out += inner
        }
        break
      }
      case "font": {
        // execCommand('foreColor') wraps in <font color="...">
        out += inner
        break
      }
      default:
        out += inner
    }
  })
  return out
}

function nodeToBlocks(root: Node): string[] {
  const blocks: string[] = []

  const pushText = (t: string) => {
    const trimmed = t.trim()
    if (trimmed) blocks.push(trimmed)
  }

  root.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      pushText((child as Text).textContent ?? "")
      return
    }
    if (child.nodeType !== 1) return
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()
    const embed = readEmbed(el)
    if (embed) {
      blocks.push(embedDirective(embed.kind, embed.url))
      return
    }

    switch (tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = Number(tag[1])
        blocks.push(`${"#".repeat(level)} ${inlineToMarkdown(el)}`)
        break
      }
      case "blockquote": {
        const inner = inlineToMarkdown(el)
        blocks.push(
          inner
            .split("\n")
            .map((l) => (l.trim() ? `> ${l.trim()}` : ">"))
            .join("\n")
        )
        break
      }
      case "ul":
        el.querySelectorAll(":scope > li").forEach((li) => {
          blocks.push(`- ${inlineToMarkdown(li)}`)
        })
        break
      case "ol": {
        let n = 1
        el.querySelectorAll(":scope > li").forEach((li) => {
          blocks.push(`${n}. ${inlineToMarkdown(li)}`)
          n++
        })
        break
      }
      case "li":
        blocks.push(`- ${inlineToMarkdown(el)}`)
        break
      case "hr":
        blocks.push("---")
        break
      case "p":
      case "div": {
        const inner = inlineToMarkdown(el)
        if (inner.trim()) blocks.push(inner.trim())
        break
      }
      default: {
        const inner = inlineToMarkdown(el)
        if (inner.trim()) blocks.push(inner.trim())
      }
    }
  })
  return blocks
}

/**
 * Converts the rich-text editor's HTML back into markdown so the article
 * can be saved/published as markdown. Runs only in the browser.
 */
export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  return nodeToBlocks(doc.body).join("\n\n")
}

/* ─── Markdown → plain-text excerpt ──────────────────────────────── */

/** Strip markdown syntax and return a plain-text excerpt. */
export function generateExcerpt(md: string, maxLength = 200): string {
  return md
    .replace(/@\[(?:instagram|facebook)\]\([^)]*\)/g, "")  // remove embeds
    .replace(/^#{1,6}\s+/gm, "")          // remove headings
    .replace(/!\[.*?\]\(.*?\)/g, "")        // remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")  // keep link text
    .replace(/(\*\*|__)(.*?)\1/g, "$2")     // remove bold
    .replace(/(\*|_)(.*?)\1/g, "$2")        // remove italic
    .replace(/`([^`]+)`/g, "$1")            // remove inline code
    .replace(/^>\s?/gm, "")                // remove blockquotes
    .replace(/^[-*]\s+/gm, "")             // remove list markers
    .replace(/^\d+\.\s+/gm, "")            // remove ordered list markers
    .replace(/---/g, "")                   // remove horizontal rules
    .replace(/\n{2,}/g, " ")               // collapse double newlines
    .replace(/\n/g, " ")                  // collapse single newlines
    .replace(/\s{2,}/g, " ")              // collapse spaces
    .trim()
    .slice(0, maxLength)
}

/* ─── In-content advertisement placement ─────────────────────────── */

/** Splits markdown into top-level blocks separated by blank lines. */
export function splitMarkdownBlocks(md: string): string[] {
  return md.split(/\n\s*\n/).filter((b) => b.trim().length > 0)
}

/**
 * Computes the 1-indexed block positions after which an in-content ad should
 * be inserted. News up to 3 blocks get no ads; from 6 blocks onward one ad is
 * inserted roughly every 5-6 blocks, growing with length and capped at `maxAds`.
 */
export function inContentAdPositions(
  blockCount: number,
  maxAds = 5,
  interval = 6
): number[] {
  if (blockCount < 6) return []
  const positions: number[] = []
  let pos = interval
  while (pos <= blockCount && positions.length < maxAds) {
    positions.push(pos)
    pos += interval
  }
  return positions
}
