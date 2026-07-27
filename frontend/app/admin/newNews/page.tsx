"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Eye,
  Pencil,
  Megaphone,
  Newspaper,
  Sparkles,
  LayoutTemplate,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/admin/admin-shell"
import { useAdminStore } from "@/components/admin/admin-store"
import { assetPath } from "@/lib/utils"

type PublishType = "noticia" | "publicidade"

type PositionKey = "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"

const POSITIONS: { key: PositionKey; label: string; description: string }[] = [
  { key: "normal", label: "Geral (Sem Destaque)", description: "Aparece apenas na listagem geral" },
  {
    key: "destaque",
    label: "Destaque principal",
    description: "Manchete no topo da home",
  },
  { key: "topo", label: "Faixa superior", description: "Logo abaixo do menu" },
  {
    key: "feed",
    label: "Feed central",
    description: "No meio da listagem principal",
  },
  {
    key: "lateral",
    label: "Barra lateral",
    description: "Coluna direita, formato compacto",
  },
  { key: "rodape", label: "Rodapé", description: "Antes do rodapé do site" },
]

export default function PublishPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const { ready, categories, articles, addArticle, updateArticle, addAd } =
    useAdminStore()

  const [type, setType] = useState<PublishType>("noticia")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>("Geral")
  const [author, setAuthor] = useState("")
  const [image, setImage] = useState("")
  const [urgent, setUrgent] = useState(false)
  const [ctaLabel, setCtaLabel] = useState("Saiba mais")
  const [ctaUrl, setCtaUrl] = useState("")
  const [position, setPosition] = useState<PositionKey>("destaque")
  const [content, setContent] = useState("")
  const [loaded, setLoaded] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load article data when editing
  useEffect(() => {
    if (!ready || loaded) return

    if (editId) {
      const article = articles.find((a) => a.id === editId)
      if (article) {
        setType("noticia")
        setTitle(article.title)
        setCategory(article.category)
        setAuthor(article.author)
        setImage(article.image)
        setUrgent(article.urgent)
        setContent(article.content || article.excerpt || "")
        setPosition(article.position || "normal")
        setLoaded(true)
      } else {
        toast.error("Notícia não encontrada.")
        router.push("/admin/noticias")
      }
    } else {
      setContent(
        "# Bem-vindo\n\nEscreva sua **matéria** aqui. Use a barra de ferramentas para *formatar* o texto."
      )
      setLoaded(true)
    }
  }, [ready, editId, articles, loaded, router])

  if (!ready || !loaded) return null

  const isEditing = !!editId

  function wrapSelection(
    before: string,
    after = before,
    placeholder = "texto"
  ) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end) || placeholder
    const next =
      content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length
      el.setSelectionRange(cursor, cursor + selected.length)
    })
  }

  function prefixLines(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const before = content.slice(0, start)
    const selected = content.slice(start, end) || "linha"
    const after = content.slice(end)
    const transformed = selected
      .split("\n")
      .map((l) => prefix + l)
      .join("\n")
    setContent(before + transformed + after)
    requestAnimationFrame(() => el.focus())
  }

  function insertLink() {
    const url = window.prompt("URL do link:", "https://")
    if (!url) return
    wrapSelection("[", `](${url})`, "texto do link")
  }

  function autoFormat() {
    const raw = content.replace(/\r\n/g, "\n")
    const lines = raw.split("\n").map((l) => l.replace(/[ \t]+$/g, ""))

    // colapsar linhas em blocos separados por linha vazia
    const blocks: string[] = []
    let buf: string[] = []
    const flush = () => {
      if (buf.length) {
        blocks.push(buf.join("\n"))
        buf = []
      }
    }
    for (const l of lines) {
      if (l.trim() === "") flush()
      else buf.push(l)
    }
    flush()

    const capitalizeSentences = (s: string) =>
      s.replace(/(^|[.!?]\s+)([a-zà-ú])/g, (_m, p, c) => p + c.toUpperCase())

    const fixPunctuation = (s: string) =>
      s
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/([,.;:!?])(?=[A-Za-zÀ-ú])/g, "$1 ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\s+$/g, "")
        .trim()

    const formatted = blocks
      .map((b) => {
        // preservar marcadores (títulos, listas, citação)
        const first = b.trimStart()
        if (/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s?)/.test(first)) {
          return b
            .split("\n")
            .map((ln) => {
              const m = ln.match(/^(\s*(?:#{1,6}\s|[-*]\s|\d+\.\s|>\s?))(.*)$/)
              if (!m) return fixPunctuation(ln)
              return m[1] + capitalizeSentences(fixPunctuation(m[2]))
            })
            .join("\n")
        }
        const joined = b.replace(/\n+/g, " ")
        return capitalizeSentences(fixPunctuation(joined))
      })
      .filter(Boolean)
      .join("\n\n")

    if (formatted === content) {
      toast("Conteúdo já está formatado.")
      return
    }
    setContent(formatted)
    toast.success("Conteúdo formatado automaticamente.")
  }

  function handleSaveDraft() {
    if (!title.trim()) {
      toast.error("Informe um título para salvar o rascunho.")
      return
    }

    if (type === "noticia") {
      const data = {
        title,
        excerpt: content.slice(0, 200),
        content,
        category,
        image: image || "/news/hero-congress.png",
        author: author || "Redação",
        status: "Rascunho" as const,
        urgent,
        position,
      }

      if (isEditing && editId) {
        updateArticle(editId, data)
        toast.success("Rascunho atualizado.")
      } else {
        addArticle(data)
        toast.success("Rascunho salvo com sucesso.")
      }
      router.push("/admin/noticias")
    } else {
      addAd({
        title,
        advertiser: author || "Anunciante",
        image: image || "/news/economy.png",
        link: ctaUrl,
        placement: positionToPlacement(position),
        active: false,
      })
      toast.success("Rascunho de publicidade salvo.")
      router.push("/admin/publicidades")
    }
  }

  function handlePublish() {
    if (!title.trim()) {
      toast.error("Informe um título.")
      return
    }
    if (!content.trim()) {
      toast.error("O conteúdo está vazio.")
      return
    }

    if (type === "noticia") {
      const data = {
        title,
        excerpt: content.slice(0, 200),
        content,
        category,
        image: image || "/news/hero-congress.png",
        author: author || "Redação",
        status: "Publicado" as const,
        urgent,
        position,
      }

      if (isEditing && editId) {
        updateArticle(editId, data)
        toast.success("Notícia atualizada com sucesso.")
      } else {
        addArticle(data)
        const positionLabel = POSITIONS.find((p) => p.key === position)?.label
        toast.success(`Notícia publicada em: ${positionLabel}.`)
      }
      router.push("/admin/noticias")
    } else {
      addAd({
        title,
        advertiser: author || "Anunciante",
        image: image || "/news/economy.png",
        link: ctaUrl,
        placement: positionToPlacement(position),
        active: true,
      })
      const positionLabel = POSITIONS.find((p) => p.key === position)?.label
      toast.success(`Publicidade publicada em: ${positionLabel}.`)
      router.push("/admin/publicidades")
    }
  }

  const isAd = type === "publicidade"

  return (
    <div className="p-6 lg:p-10">
      <PageHeader
        title={isEditing ? "Editar notícia" : "Publicar"}
        description={
          isEditing
            ? "Altere os dados da matéria e salve ou publique novamente."
            : "Crie uma notícia ou publicidade com editor formatado e pré-visualização."
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              {isEditing ? "Salvar como rascunho" : "Salvar rascunho"}
            </Button>
            <Button onClick={handlePublish}>
              {isEditing ? "Salvar e publicar" : "Publicar"}
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* EDITOR */}
        <Card className="p-5">
          {!isEditing && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setType("noticia")}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    type === "noticia"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Newspaper className="h-4 w-4" /> Notícia
                </button>
                <button
                  type="button"
                  onClick={() => setType("publicidade")}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    type === "publicidade"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Megaphone className="h-4 w-4" /> Publicidade
                </button>
              </div>

              <Separator className="my-5" />
            </>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isAd ? "Título da campanha" : "Título da matéria"
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author">
                  {isAd ? "Anunciante" : "Autor"}
                </Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={isAd ? "Nome do anunciante" : "Nome do autor"}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Imagem (URL)</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Posição no site</Label>
              <Select
                value={position}
                onValueChange={(v) => v && setPosition(v as PositionKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {POSITIONS.find((p) => p.key === position)?.description}
              </p>
            </div>

            {isAd ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cta">Texto do botão</Label>
                  <Input
                    id="cta"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ctaUrl">URL do botão</Label>
                  <Input
                    id="ctaUrl"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="urgent" className="text-sm">
                    Marcar como urgente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Destaca a matéria com selo vermelho.
                  </p>
                </div>
                <Switch
                  id="urgent"
                  checked={urgent}
                  onCheckedChange={setUrgent}
                />
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={autoFormat}
                  className="h-8 gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Formatar
                  automaticamente
                </Button>
              </div>
              <div className="rounded-md border border-border">
                <FormatterToolbar
                  onBold={() => wrapSelection("**", "**", "negrito")}
                  onItalic={() => wrapSelection("*", "*", "itálico")}
                  onH1={() => prefixLines("# ")}
                  onH2={() => prefixLines("## ")}
                  onQuote={() => prefixLines("> ")}
                  onUl={() => prefixLines("- ")}
                  onOl={() => prefixLines("1. ")}
                  onLink={insertLink}
                />
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva aqui..."
                  className="min-h-[280px] resize-y rounded-none border-0 focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Suporta markdown básico: **negrito**, *itálico*, # títulos,
                listas, [links](https://). O botão acima ajusta espaços,
                pontuação e maiúsculas.
              </p>
            </div>
          </div>
        </Card>

        {/* PREVIEW */}
        <Card className="p-5">
          <Tabs defaultValue="preview">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Pré-visualização
              </h2>
              <TabsList>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" /> Posição
                </TabsTrigger>
                <TabsTrigger value="source" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Fonte
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="mt-4">
              <ArticlePreview
                type={type}
                title={title}
                category={category}
                author={author}
                image={image}
                urgent={urgent}
                content={content}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
              />
            </TabsContent>

            <TabsContent value="layout" className="mt-4">
              <SiteLayoutPreview
                position={position}
                title={title}
                isAd={isAd}
              />
            </TabsContent>

            <TabsContent value="source" className="mt-4">
              <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed text-foreground">
                {content || "(vazio)"}
              </pre>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

/* ─── helpers ────────────────────────────────────────────────────── */

function positionToPlacement(
  pos: PositionKey
): "Topo (Leaderboard)" | "Lateral (Box)" | "Rodapé" {
  switch (pos) {
    case "topo":
    case "destaque":
    case "feed":
    case "normal":
      return "Topo (Leaderboard)"
    case "lateral":
      return "Lateral (Box)"
    case "rodape":
      return "Rodapé"
  }
}

/* ─── sub-components ─────────────────────────────────────────────── */

function FormatterToolbar(props: {
  onBold: () => void
  onItalic: () => void
  onH1: () => void
  onH2: () => void
  onQuote: () => void
  onUl: () => void
  onOl: () => void
  onLink: () => void
}) {
  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
      <button
        type="button"
        className={btn}
        onClick={props.onH1}
        aria-label="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onH2}
        aria-label="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        className={btn}
        onClick={props.onBold}
        aria-label="Negrito"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onItalic}
        aria-label="Itálico"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onLink}
        aria-label="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        className={btn}
        onClick={props.onUl}
        aria-label="Lista"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onOl}
        aria-label="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        onClick={props.onQuote}
        aria-label="Citação"
      >
        <Quote className="h-4 w-4" />
      </button>
    </div>
  )
}

function ArticlePreview(props: {
  type: PublishType
  title: string
  category: string
  author: string
  image: string
  urgent: boolean
  content: string
  ctaLabel: string
  ctaUrl: string
}) {
  const {
    type,
    title,
    category,
    author,
    image,
    urgent,
    content,
    ctaLabel,
    ctaUrl,
  } = props
  const isAd = type === "publicidade"

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetPath(image)}
          alt=""
          className="h-56 w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          Imagem de capa
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{category}</Badge>
          {isAd && (
            <Badge className="bg-primary text-primary-foreground">
              Publicidade
            </Badge>
          )}
          {!isAd && urgent && (
            <span className="text-xs font-semibold tracking-wide text-destructive uppercase">
              Urgente
            </span>
          )}
        </div>
        <h3 className="mt-3 text-2xl leading-tight font-semibold text-foreground">
          {title || (isAd ? "Título da campanha" : "Título da matéria")}
        </h3>
        {author && (
          <p className="mt-2 text-xs text-muted-foreground">Por {author}</p>
        )}
        <div
          className="prose-basic mt-4 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {isAd && ctaUrl && (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {ctaLabel || "Saiba mais"}
          </a>
        )}
      </div>
    </article>
  )
}

// Minimal safe markdown renderer (escapes HTML, then applies inline/block rules).
function renderMarkdown(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-primary underline">$1</a>'
      )

  const lines = src.split("\n")
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#\s+/.test(line)) {
      out.push(
        `<h1 class="mt-4 text-2xl font-bold">${inline(line.replace(/^#\s+/, ""))}</h1>`
      )
      i++
    } else if (/^##\s+/.test(line)) {
      out.push(
        `<h2 class="mt-4 text-xl font-semibold">${inline(line.replace(/^##\s+/, ""))}</h2>`
      )
      i++
    } else if (/^>\s?/.test(line)) {
      out.push(
        `<blockquote class="mt-3 border-l-2 border-border pl-3 italic text-muted-foreground">${inline(line.replace(/^>\s?/, ""))}</blockquote>`
      )
      i++
    } else if (/^-\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^-\s+/, ""))}</li>`)
        i++
      }
      out.push(`<ul class="mt-2 list-disc pl-5">${items.join("")}</ul>`)
    } else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`)
        i++
      }
      out.push(`<ol class="mt-2 list-decimal pl-5">${items.join("")}</ol>`)
    } else if (line.trim() === "") {
      out.push("")
      i++
    } else {
      out.push(`<p class="mt-3">${inline(line)}</p>`)
      i++
    }
  }
  return out.join("\n")
}

function SiteLayoutPreview({
  position,
  title,
  isAd,
}: {
  position: PositionKey
  title: string
  isAd: boolean
}) {
  const label = isAd ? "Publicidade" : "Notícia"
  const displayTitle =
    title || (isAd ? "Sua campanha aqui" : "Sua notícia aqui")
  const Slot = ({
    active,
    children,
    className = "",
  }: {
    active: boolean
    children: React.ReactNode
    className?: string
  }) => (
    <div
      className={`rounded border p-2 text-[10px] transition-colors ${
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-dashed border-border bg-muted/40 text-muted-foreground"
      } ${className}`}
    >
      {active ? (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="truncate font-medium">
            {label}: {displayTitle}
          </span>
        </div>
      ) : (
        children
      )}
    </div>
  )

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
        <span>meusite.com</span>
        <span>Menu · Buscar</span>
      </div>

      <Slot active={position === "topo"} className="mb-2">
        Faixa superior
      </Slot>
      <Slot
        active={position === "destaque"}
        className="mb-2 flex h-16 items-center"
      >
        Destaque principal
      </Slot>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Slot active={false}>Matéria</Slot>
          <Slot active={position === "feed"} className="flex h-14 items-center">
            Feed central
          </Slot>
          <Slot active={false}>Matéria</Slot>
          <Slot active={false}>Matéria</Slot>
        </div>
        <div className="space-y-2">
          <Slot
            active={position === "lateral"}
            className="flex h-24 items-center"
          >
            Barra lateral
          </Slot>
          <Slot active={false} className="h-12">
            Widget
          </Slot>
        </div>
      </div>

      <Slot active={position === "rodape"} className="mt-2">
        Rodapé
      </Slot>
      <div className="mt-1 rounded bg-muted px-2 py-1 text-center text-[10px] text-muted-foreground">
        © meusite
      </div>
    </div>
  )
}
