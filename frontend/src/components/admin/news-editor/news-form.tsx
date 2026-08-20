"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { Check, FileText, Hash, Sparkles, Type } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FormatterToolbar } from "./formatter-toolbar"
import { ImageUploader } from "./image-uploader"
import { htmlToMarkdown, renderMarkdown } from "./markdown-utils"

import { type NewsPosition } from "@/features/admin/news/types/news"

function escapeAttr(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type NewsFormTag = {
  id: string
  name: string
  color?: string | null
}

interface NewsFormProps {
  title: string
  setTitle: (val: string) => void
  category: string
  setCategory: (val: string) => void
  categories: string[]
  tags?: NewsFormTag[]
  selectedTagIds?: string[]
  setSelectedTagIds?: (ids: string[]) => void
  position?: NewsPosition
  setPosition?: (val: NewsPosition) => void
  positionOrder?: number
  setPositionOrder?: (val: number) => void
  image: string
  setImage: (val: string) => void
  urgent: boolean
  setUrgent: (val: boolean) => void
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
}

const POSITION_LABELS: { value: NewsPosition; label: string }[] = [
  { value: "normal", label: "Padrão (Sem destaque fixo)" },
  { value: "destaque", label: "Destaque Principal" },
  { value: "topo", label: "Manchete do Topo" },
  { value: "feed", label: "Feed de Notícias" },
  { value: "lateral", label: "Barra Lateral" },
  { value: "rodape", label: "Rodapé" },
]

export function NewsForm({
  title,
  setTitle,
  category,
  setCategory,
  categories,
  tags,
  selectedTagIds,
  setSelectedTagIds,
  position = "normal",
  setPosition,
  positionOrder = 0,
  setPositionOrder,
  image,
  setImage,
  urgent,
  setUrgent,
  content,
  setContent,
}: NewsFormProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastContentRef = useRef<string | null>(null)
  const savedRangeRef = useRef<Range | null>(null)

  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0)
    }
  }

  function restoreSelection() {
    const el = editorRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    el.focus()
    if (savedRangeRef.current) {
      try {
        sel.removeAllRanges()
        sel.addRange(savedRangeRef.current)
      } catch {
        savedRangeRef.current = null
      }
    }
  }

  /* ─── Rich text editor (markdown under the hood) ────────────────── */

  // Sync external `content` (markdown) into the editor as rendered HTML.
  useEffect(() => {
    if (lastContentRef.current === content) return
    lastContentRef.current = content
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(content) || ""
    }
  }, [content])

  function syncFromEditor() {
    const el = editorRef.current
    if (!el) return
    const md = htmlToMarkdown(el.innerHTML)
    lastContentRef.current = md
    setContent(md)
  }

  const exec = useCallback(
    (command: string, value?: string) => {
      restoreSelection()
      document.execCommand(command, false, value)
      syncFromEditor()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function insertHtml(html: string) {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    syncFromEditor()
  }

  function insertLink() {
    const url = window.prompt("URL do link:", "https://")
    if (!url) return
    const range = savedRangeRef.current
    if (range && !range.collapsed) {
      exec("createLink", url)
    } else {
      insertHtml(`<a href="${escapeAttr(url)}">texto do link</a>`)
    }
  }

  function insertImage() {
    const url = window.prompt("URL da imagem:", "https://")
    if (!url) return
    const alt = window.prompt("Texto alternativo:", "imagem") || "imagem"
    insertHtml(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`)
  }

  function insertUploadedImage(dataUrl: string) {
    const alt = window.prompt("Texto alternativo da imagem:", "imagem") || "imagem"
    insertHtml(`<img src="${dataUrl}" alt="${escapeAttr(alt)}" />`)
  }

  function insertHorizontalRule() {
    insertHtml("<hr />")
  }

  function handleCode() {
    const range = savedRangeRef.current
    const text =
      range && !range.collapsed ? escapeAttr(range.toString()) : "código"
    insertHtml(`<code>${text}</code>`)
  }

  /* ─── Keyboard shortcuts ────────────────────────────────────────── */

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (!isMeta) return

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault()
          exec("bold")
          break
        case "i":
          e.preventDefault()
          exec("italic")
          break
        case "e":
          e.preventDefault()
          handleCode()
          break
        case "k":
          e.preventDefault()
          insertLink()
          break
      }
    }

    el.addEventListener("keydown", handleKeyDown)
    return () => el.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exec])

  /* ─── Auto-format helper ────────────────────────────────────────── */

  function autoFormat() {
    const raw = content.replace(/\r\n/g, "\n")
    const lines = raw.split("\n").map((l) => l.replace(/[ \t]+$/g, ""))

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
        const first = b.trimStart()
        if (/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s?|---)/.test(first)) {
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
    lastContentRef.current = formatted
    setContent(formatted)
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(formatted) || ""
    }
    toast.success("Conteúdo formatado automaticamente.")
  }

  /* ─── Content stats ─────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const text = content.trim()
    if (!text) return { chars: 0, words: 0 }
    const chars = text.length
    const words = text.split(/\s+/).filter(Boolean).length
    return { chars, words }
  }, [content])

  return (
    <Card className="overflow-hidden p-0">
      {/* ─── Section: Article info ────────────────────────── */}
      <div className="border-b border-border bg-muted/20 px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <FileText className="h-3.5 w-3.5" />
          Informações da matéria
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da matéria"
            className="text-base font-medium"
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
            <Label>Autor</Label>
            <Input
              value="Você (definido pelo usuário logado)"
              disabled
              className="text-muted-foreground"
            />
          </div>
        </div>

        {tags && tags.length > 0 && setSelectedTagIds && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Tags / Palavras-chave</Label>
              <span className="text-xs text-muted-foreground">
                {selectedTagIds?.length ?? 0}{" "}
                {selectedTagIds?.length === 1 ? "selecionada" : "selecionadas"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5 min-h-[44px] items-center">
              {tags.map((t) => {
                const isSelected = selectedTagIds?.includes(t.id) ?? false
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTagIds(selectedTagIds?.filter((id) => id !== t.id) ?? [])
                      } else {
                        setSelectedTagIds([...(selectedTagIds ?? []), t.id])
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer",
                      isSelected
                        ? "shadow-xs ring-1 ring-primary/40 font-semibold"
                        : "opacity-65 hover:opacity-100 hover:scale-[1.02]"
                    )}
                    style={{
                      backgroundColor: isSelected
                        ? `${t.color || "#6366f1"}25`
                        : `${t.color || "#6366f1"}0d`,
                      color: t.color || "currentColor",
                      borderColor: isSelected
                        ? t.color || "currentColor"
                        : `${t.color || "#6366f1"}35`,
                    }}
                  >
                    <Hash className="h-3 w-3" />
                    <span>{t.name}</span>
                    {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <ImageUploader value={image} onChange={setImage} label="Imagem de capa" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="position">Posição na Tela Principal</Label>
            <Select
              value={position}
              onValueChange={(v) => setPosition?.(v as NewsPosition)}
            >
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_LABELS.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="positionOrder">
              Ordem de Prioridade {!(position === "feed" || position === "lateral") && <span className="text-xs text-muted-foreground font-normal">(apenas feed/lateral)</span>}
            </Label>
            <Input
              id="positionOrder"
              type="number"
              min={0}
              disabled={!(position === "feed" || position === "lateral")}
              value={positionOrder}
              onChange={(e) => setPositionOrder?.(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0 (primeiro), 1, 2..."
              className={!(position === "feed" || position === "lateral") ? "text-muted-foreground opacity-60" : ""}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3.5">
          <div>
            <Label htmlFor="urgent" className="text-sm">
              Marcar como urgente
            </Label>
            <p className="text-xs text-muted-foreground">
              Destaca a matéria com selo vermelho.
            </p>
          </div>
          <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
        </div>
      </div>

      <Separator />

      {/* ─── Section: Content editor ──────────────────────── */}
      <div className="border-b border-border bg-muted/20 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Type className="h-3.5 w-3.5" />
            Conteúdo
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={autoFormat}
            className="h-7 gap-1.5 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            Formatar
          </Button>
        </div>
      </div>

      <div className="relative">
        <FormatterToolbar
          onBold={() => exec("bold")}
          onItalic={() => exec("italic")}
          onH1={() => exec("formatBlock", "h1")}
          onH2={() => exec("formatBlock", "h2")}
          onH3={() => exec("formatBlock", "h3")}
          onQuote={() => exec("formatBlock", "blockquote")}
          onUl={() => exec("insertUnorderedList")}
          onOl={() => exec("insertOrderedList")}
          onLink={insertLink}
          onImage={insertImage}
          onUploadImage={insertUploadedImage}
          onCode={handleCode}
          onHr={insertHorizontalRule}
        />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Escreva o conteúdo da matéria..."
          onSelect={saveSelection}
          onBlur={() => {
            saveSelection()
            syncFromEditor()
          }}
          onInput={syncFromEditor}
          className="editor-area min-h-[360px] resize-y overflow-auto px-4 py-3 text-sm leading-relaxed text-foreground transition-shadow focus:outline-none focus-visible:ring-0"
        />

        {/* ─── Status bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          <span>
            {stats.words} {stats.words === 1 ? "palavra" : "palavras"} ·{" "}
            {stats.chars} {stats.chars === 1 ? "caractere" : "caracteres"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Markdown
          </span>
        </div>
      </div>

      <div className="px-5 pb-4 pt-2">
        <p className="text-xs text-muted-foreground">
          Use a barra de formatação ou atalhos de teclado (⌘B, ⌘I, ⌘E, ⌘K).
          O conteúdo é salvo em Markdown.
        </p>
      </div>
    </Card>
  )
}
