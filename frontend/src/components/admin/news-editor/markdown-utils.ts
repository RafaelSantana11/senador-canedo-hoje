/**
 * Shared markdown utilities for the news editor.
 *
 * - `renderMarkdown`  – converts markdown source into safe HTML for preview
 * - `htmlToMarkdown`  – converts rich-editor HTML back into markdown
 * - `generateExcerpt` – strips markdown syntax and returns a plain-text excerpt
 */

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
 * Minimal safe markdown renderer.
 * Escapes HTML first, then applies block/inline markdown rules.
 * Supports: headings (h1-h3), bold, italic, inline code, links, images,
 * blockquotes, unordered/ordered lists, horizontal rules, and paragraphs.
 */
export function renderMarkdown(src: string): string {
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
